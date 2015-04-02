document.getElementsByClassName('dialog')[0].innerHTML = '<br>Please wait...\n<br>\n<br>';

function createElement(elementType, applicationType, scriptName, callback) {
	var s = document.createElement(elementType);
	if (elementType === 'script') {
		s.src = chrome.extension.getURL(scriptName);
	} else if (elementType === 'link') {
		s.rel = 'stylesheet';
		s.href = chrome.extension.getURL(scriptName);
	}
	s.type = applicationType;
	s.onload = function() {
		this.parentNode.removeChild(this);
		callback && callback();
	};
	(document.head || document.documentElement).appendChild(s);
}

// createElement('link', 'text/css', 'application.css', null);
createElement('script', 'text/javascript', 'libs.js', function() {
	createElement('script', 'text/javascript', 'user.js', null);
});
