
window.onload = function() {
	var hichat = new HiChat();
	hichat.init();
};
var HiChat = function() {
	this.socket = null;
};
HiChat.prototype = {
	init: function() {
		var that = this;
		this.socket = io.connect();
		this.socket.on('connect', function() {
			document.getElementById('info').textContent = '输入一个昵称：';
			document.getElementById('nickWrapper').style.display = 'block';
			document.getElementById('nicknameInput').focus();
		});
		this.socket.on('nickExisted', function() {
			document.getElementById('info').textContent = '!nickname is taken, choose another pls';
		});
		this.socket.on('loginSuccess', function() {
			document.title = '网络聊天 | ' + document.getElementById('nicknameInput').value;
			document.getElementById('loginWrapper').style.display = 'none';
			document.getElementById('messageInput').focus();
		});
		this.socket.on('error', function(err) {
			if (document.getElementById('loginWrapper').style.display == 'none') {
				document.getElementById('status').textContent = '连接失败！';
			} else {
				document.getElementById('info').textContent = '连接失败！';
			}
		});
		this.socket.on('system', function(nickName, userCount, type) {
			var msg = nickName + (type == 'login' ? ' joined' : ' left');
			that._displayNewMsg('system ', msg, 'red');
			document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' 位用户') + '在线';
		});
		this.socket.on('newMsg', function(user, msg, color) {
			that._displayNewMsg(user, msg, color);
		});
		this.socket.on('newImg', function(user, img, color) {
			that._displayImage(user, img, color);
		});
		document.getElementById('loginBtn').addEventListener('click', function() {
			var nickName = document.getElementById('nicknameInput').value;
			if (nickName.trim().length != 0) {
				that.socket.emit('login', nickName);
			} else {
				document.getElementById('nicknameInput').focus();
			};
		}, false);
		document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
			if (e.keyCode == 13) {
				var nickName = document.getElementById('nicknameInput').value;
				if (nickName.trim().length != 0) {
					that.socket.emit('login', nickName);
				};
			};
		}, false);
		document.getElementById('sendBtn').addEventListener('click', function() {
			var nickName = document.getElementById('nicknameInput').value;
			var messageInput = document.getElementById('messageInput'),
				msg = "<br/>" + messageInput.value.replaceAll(" ", "&nbsp").replaceAll("<", "&lt").replaceAll(">", "&gt").replaceAll("\n", "<br/>").replaceAll("\t", "&nbsp&nbsp&nbsp&nbsp"),
				color = document.getElementById('colorStyle').value;
			messageInput.value = '';
			messageInput.focus();
			if (msg.trim().length != 0) {
				that.socket.emit('postMsg', msg, color);
				that._displayNewMsg('【'+nickName+'】', msg, color);
				return;
			};
		}, false);
		document.getElementById('sendBtn2').addEventListener('click', function() {
			var messageInput = document.getElementById('messageInput'),
				msg = "<br/>" + messageInput.value,
				color = document.getElementById('colorStyle').value;
			messageInput.value = '';
			messageInput.focus();
			if (msg.trim().length != 0) {
				that.socket.emit('postMsg', msg, color);
				that._displayNewMsg('me', msg, color);
				return;
			};
		}, false);
		document.getElementById('messageInput').addEventListener('keyup', function(e) {
			var messageInput = document.getElementById('messageInput'),
				msg = "<br/>" + messageInput.value.replaceAll(" ", "&nbsp").replaceAll("<", "&lt").replaceAll(">", "&gt").replaceAll("\n", "<br/>").replaceAll("\t", "&nbsp&nbsp&nbsp&nbsp"),
				color = document.getElementById('colorStyle').value;
			if (e.keyCode == 13 && window.event.ctrlKey && msg.trim().length != 0) {
				messageInput.value = '';
				that.socket.emit('postMsg', msg, color);
				that._displayNewMsg('me', msg, color);
			};
		}, false);
		document.getElementById('clearBtn').addEventListener('click', function() {
			document.getElementById('historyMsg').innerHTML = '';
		}, false);
		document.getElementById('sendImage').addEventListener('change', function() {
			if (this.files.length != 0) {
				var ireg = /image\/.*/i;
				var file = this.files[0],
					reader = new FileReader(),
					color = document.getElementById('colorStyle').value;
				if (!file.type.match(ireg)) {
					alert("该文件格式不是图片格式");
					return;
				}
				if (!reader) {
					that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
					this.value = '';
					return;
				};
				reader.onload = function(e) {
					this.value = '';
					that.socket.emit('img', e.target.result, color);
					that._displayImage('me', e.target.result, color);
				};
				reader.readAsDataURL(file);
			};
		}, false);
		this._initialEmoji();
		document.getElementById('emoji').addEventListener('click', function(e) {
			var emojiwrapper = document.getElementById('emojiWrapper');
			emojiwrapper.style.display = 'block';
			e.stopPropagation();
		}, false);
		document.body.addEventListener('click', function(e) {
			var emojiwrapper = document.getElementById('emojiWrapper');
			if (e.target != emojiwrapper) {
				emojiwrapper.style.display = 'none';
			};
		});
		document.getElementById('emojiWrapper').addEventListener('click', function(e) {
			var target = e.target;
			if (target.nodeName.toLowerCase() == 'img') {
				var messageInput = document.getElementById('messageInput');
				messageInput.focus();
				messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
			};
		}, false);
	},
	_initialEmoji: function() {
		var emojiContainer = document.getElementById('emojiWrapper'),
			docFragment = document.createDocumentFragment();
		for (var i = 69; i > 0; i--) {
			var emojiItem = document.createElement('img');
			emojiItem.src = '../content/emoji/' + i + '.gif';
			emojiItem.title = i;
			docFragment.appendChild(emojiItem);
		};
		emojiContainer.appendChild(docFragment);
	},
	_displayNewMsg: function(user, msg, color) {
		var container = document.getElementById('historyMsg'),
			msgToDisplay = document.createElement('div'),
			date = new Date().toTimeString().substr(0, 8),
			msgDiv = document.createElement('div'),
			msg = this._showEmoji(msg);
		$(msgToDisplay).addClass("row");
		$(msgDiv).addClass("columns");
		msgDiv.style.color = color || '#000';
		msgDiv.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
		msgToDisplay.appendChild(msgDiv);
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
	},
	_displayImage: function(user, imgData, color) {
		var container = document.getElementById('historyMsg'),
			msgToDisplay = document.createElement('p'),
			date = new Date().toTimeString().substr(0, 8);
		msgToDisplay.style.color = color || '#000';
		msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<img src="' + imgData + '"/>';
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
	},
	_showEmoji: function(msg) {
		var match, result = msg,
			reg = /\[emoji:\d+\]/g,
			emojiIndex,
			totalEmojiNum = document.getElementById('emojiWrapper').children.length;
		while (match = reg.exec(msg)) {
			emojiIndex = match[0].slice(7, -1);
			if (emojiIndex > totalEmojiNum) {
				result = result.replace(match[0], '[X]');
			} else {
				result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />'); //todo:fix this in chrome it will cause a new request for the image
			};
		};
		return result;
	}
};

String.prototype.replaceAll = function(reallyDo, replaceWith, ignoreCase) {
	if (!RegExp.prototype.isPrototypeOf(reallyDo)) {
		return this.replace(new RegExp(reallyDo, (ignoreCase ? "gi" : "g")), replaceWith);
	} else {
		return this.replace(reallyDo, replaceWith);
	}
}