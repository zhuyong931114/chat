var user = {}; // 保存当前用户信息
var id = sessionStorage.getItem('id');
if (!id) {
    location.href = 'login.html';
}
user.id = id;
$.ajax({
    url: 'api/user/queryUserInformationByUserId',
    type: 'POST',
    data: {userId: id},
    success: function (res) {
        if (res) {
            if (res.code == 1000) {
                $('#username').text(res.data.name);
                user.name = res.data.name;
            } else {
                layer.msg(res.msg);
            }
        } else {
            layer.msg('网络错误！');
        }
    },
	error:function(err){
		layer.msg('网络错误，请稍候再试！');
	}
});

function openDialog(id, name) {//id为回话id，name为对方昵称
    if (stompClient && stompClient.connected) {
        stompClient.disconnect();
    }
    initBox(id, name);
    layer.open({
        type: 1,
        title: false,
        closeBtn: 2,
        shade: 0,
        shadeClose: false, //点击遮罩关闭
        content: $('#chat'),
        cancel: function () {
            stompClient.disconnect();
        },
    });
    setTimeout('$(".chat-content")[0].scrollTop=99999;', 150);//延时设置滚动条位置到底部
}

function showGroup() {
    $('#group-list').show();
    $('#dialog-list').hide();
}

function showDialog() {
    $('#group-list').hide();
    $('#dialog-list').show();
}

$('#delete-record').click(function () {
    $('#chat-log').html('');
    $('#log-box').html('');
});

$('#max').click(function () {
    $('#chat-record').css('width', '100%');
    $('#max').hide();
    $('#min').show();
});

$('#min').click(function () {
    $('#chat-record').css('width', '480px');
    $('#min').hide();
    $('#max').show();
});

$('#img').change(function () {
    $.ajax({
        url: 'api/chat/uploadFile',
        data: new FormData($('#form-img')[0]),
        type: 'POST',
        processData: false,
        contentType: false,
        success: function (res) {
            var msg = 'http://' + location.host + '/chat/images/chat-img/' + res.data[0] + '-' + user.id;
            sendMsg(msg, 'photo');
            $('#img').val('');
        },
        error: function (err) {
            layer.msg('网络错误，请稍候再试！');
            $('#img').val('');
        }
    });
});

$('#input').keydown(function (e) {
    if (e.keyCode == 13) {
        $('#send').trigger('click');
    }
});

$('#send').click(function () {
    var msg = $('#input').val();
    if (msg.trim().length > 0) {
        sendMsg(msg + '-' + user.id, 'text');
    }
});

$('.search-box i').click(function () {
    layer.msg('此功能暂未实现');
});

$('.main-tool i').click(function () {
    layer.msg('此功能暂未实现');
});

layer.open({
    type: 1,
    title: false,
    closeBtn: 0,
    shade: 0,
    offset: 'rb',
    shadeClose: false, //点击遮罩关闭
    content: $('#main'),
});

$.ajax({
    url: 'api/user/queryAllContactByUserId',
    type: 'POST',
    data: {userId: id},
    success: function (res) {
        if (res) {
            if (res.code == 1000) {
                var html = '';
                for (var i = 0; i < res.data.length; i++) {
                    var obj = res.data[i];
                    html += '<li onclick="createConversation(\'' + obj.id + '\',\'' + (obj.name ? obj.name : '') + '\')" id="' + obj.id + '">'
                        + '<img src="images/default.jpg">'
                        + '<div>'
                        + '	<span>' + obj.name + '</span>'
                        + '</div>'
                        + '</li>';
                }
                $('#friend-list').html(html);
            } else {
                layer.msg(res.msg);
            }
        } else {
            layer.msg('网络错误！');
        }
    },
	error:function(err){
		layer.msg('网络错误，请稍候再试！');
	}
});

function initCoversationList() {
    $.ajax({
        url: 'api/chat/queryAllConversationByParticipantUserId',
        type: 'POST',
        data: {userId: id},
        success: function (res) {
            if (res) {
                if (res.code == 1000) {
                    var html = '';
                    for (var i = 0; i < res.data.length; i++) {
                        var obj = res.data[i];
                        html += '<li onclick="openDialog(\'' + obj.id + '\',\'' + (obj.title ? obj.title : '') + '\')">'
                            + '<img src="images/default.jpg">'
                            + '<div>'
                            + '<span>' + obj.title + '</span>'
                            + '<p>' + obj.messageContext + '</p>'
                            + '</div>'
                            + '</li>';
                    }
                    $('#dialog-list').html(html);
                } else {
                    layer.msg(res.msg);
                }
            } else {
                layer.msg('网络错误！');
            }
        },
		error:function(err){
			layer.msg('网络错误，请稍候再试！');
		}
    });
}

initCoversationList();

function createConversation(contactId, name) {
    var title = user.name + "," + name;
    $.ajax({
        url: 'api/chat/createConversation',
        type: 'POST',
        data: {userId: user.id, contactId: contactId, title: title},
        success: function (res) {
            if (res && res.data) {
                var coversationId = res.data;
                openDialog(coversationId, name);
            } else {
                layer.msg('网络错误！');
                return null;
            }
        },
		error:function(err){
			layer.msg('网络错误，请稍候再试！');
		}
    });
}

var curConversationId = null;

function initBox(conversationId, name) {
    $("#chat-user-name").text(name);
    curConversationId = conversationId;
    var limit = 15;
    $.ajax({
        url: 'api/chat/queryMessageByConversationIdWithLimit',
        type: 'POST',
        data: {conversationId: conversationId, limit: limit},
        success: function (res) {
            if (res) {
                if (res.code == 1000) {
                    var html = '';
                    res.data = res.data.reverse();
                    for (var i = 0; i < res.data.length; i++) {
                        var obj = res.data[i];
                        var msg = obj.messageType == 'text' ? obj.content : '<img src="' + obj.content + '" onclick="window.open(\'' + obj.content + '\')">';
                        html += '<li class=' + (obj.senderId == id ? 'chat-user-mine' : '') + '>'
                            + '<div class="chat-user">'
                            + '<img src="images/default.jpg">'
                            + '<div><span>' + obj.name + '</span> <span>' + obj.time + '</span></div>'
                            + '</div>'
                            + '<div class="chat-text">' + msg + '</div>'
                            + '</li>';
                    }
                    $('#log-box').html(html);
                } else {
                    layer.msg(res.msg);
                }
            } else {
                layer.msg('网络错误！');
            }
        },
		error:function(err){
			layer.msg('网络错误，请稍候再试！');
		}
    });
    login(conversationId);
}

var stompClient = null;

function login(conversationId) {
    var socket = new SockJS('api/websocket/' + conversationId);
    stompClient = Stomp.over(socket)
    stompClient.connect({}, function () {
        stompClient.subscribe('/user/chat/contact', function (frame) {
            var entity = JSON.parse(frame.body);
            flushBox(entity);
        })
    })
}

function flushBox(entity) {
    createTime = entity.createTime.replace('T', ' ');
    createTime = createTime.substring(0, createTime.indexOf('.'));
    var msg = entity.messageContext;
    var type = entity.messageType;
    if (type == 'photo') {
        msg = '<img src="' + msg + '" onclick="window.open(\'' + msg + '\')">';
    }
    var html = '<li ' + (entity.senderId == user.id ? 'class="chat-user-mine"' : '') + '>'
        + '<div class="chat-user">'
        + '<img src="images/default.jpg">'
        + '<div><span>' + user.name + '</span> <span>' + createTime + '</span></div>'
        + '</div>'
        + '<div class="chat-' + (type == 'text' ? 'text' : 'img') + '">' + msg + '</div>'
        + '</li>';
    $('#log-box').append(html);
    setTimeout('$(".chat-content")[0].scrollTop=99999;', 200);//延时设置滚动条位置到底部
    $('#input').val('');
    initCoversationList();
}

function sendMsg(msg, type) {
    stompClient.send('/app/sendMsg', {}, JSON.stringify({
        conversationId: curConversationId,
        senderId: msg.substring(msg.lastIndexOf('-') + 1),
        messageType: type,
        messageContext: msg.substring(0, msg.lastIndexOf('-')),
        createTime: new Date(),
    }));
    initCoversationList();
}

$('#record-tool').click(function () {
    var limit = 100;
    $('#record-user').text($('#chat-user-name').text());
    var html = '';
    $.ajax({
        url: 'api/chat/queryMessageByConversationIdWithLimit',
        type: 'POST',
        data: {conversationId: curConversationId, limit: limit},
        success: function (res) {
            if (res) {
                if (res.code == 1000) {
                    var html = '';
                    res.data = res.data.reverse();
                    for (var i = 0; i < res.data.length; i++) {
                        var obj = res.data[i];
                        var msg = obj.messageType == 'text' ? obj.content : '<img src="' + obj.content + '" onclick="window.open(\'' + obj.content + '\')">';
                        html += '<li class=' + (obj.senderId == id ? 'chat-user-mine' : '') + '>'
                            + '<div class="chat-user">'
                            + '<img src="images/default.jpg">'
                            + '<div><span>' + obj.name + '</span> <span>' + obj.time + '</span></div>'
                            + '</div>'
                            + '<div class="chat-text">' + msg + '</div>'
                            + '</li>';
                    }
                    $('#chat-log').html(html);
                    $('#chat-record').show();
                } else {
                    layer.msg(res.msg);
                }
            } else {
                layer.msg('网络错误！');
            }
        },
		error:function(err){
			layer.msg('网络错误，请稍候再试！');
		}
    });
});