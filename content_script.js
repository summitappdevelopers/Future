document.getElementsByClassName('dialog')[0].innerHTML = '<br>Please wait...\n<br>\n<br>';

function createElement(elementType, scriptName, callback) {
	var s = document.createElement(elementType);
	if (elementType === 'script') {
		s.src = chrome.extension.getURL(scriptName);
	} else if (elementType === 'link') {
		s.rel = 'stylesheet';
		s.href = chrome.extension.getURL(scriptName);
	}
	s.onload = function() {
		this.parentNode.removeChild(this);
		callback && callback();
	};
	(document.head || document.documentElement).appendChild(s);
}

// createElement('link', 'application.css');
createElement('script', 'libs.js', function() {
	createElement('script', 'user.js');
});
