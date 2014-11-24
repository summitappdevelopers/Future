var cog_avg = function cog_avg(arr) {
	var score_sum = 0,
		avg_weight = 0;

	for (var i = 0; i < arr.length; i++) {
		score_sum += arr[i].weight * arr[i].score;
		avg_weight += arr[i].weight;
	}

	return Math.round(score_sum / avg_weight * 100) / 100;
};

raw = $('<body></body>').append($.ajax({ type: 'GET', url: 'https://app.mysummitps.org/my/grades', async: false }).responseText);
grades = [];

raw.find('#act-as-bar').remove();
raw.find('#flash').remove();
raw.find('.navbar-inner').remove();
raw.find('.nav').remove();
raw.find('.navbar').remove();
raw.find('script').remove();
raw.find('style').remove();
raw.find('meta').remove();
raw.find('link').remove();
raw.find('title').remove();
raw.find('.container-fluid').css('margin-top', '20px');
raw.find('.hide').toggleClass('hide');
raw.find('table.table.table-bordered.table-condensed.scores-table>thead>tr:even').remove();
raw.find('em').text('These grades may not represent your current grades.').css('color', 'red').after('&nbsp; &nbsp; <button>Reset Grades</button>');

raw.find('div.course.boxed').toArray().forEach(function(elem) {
	elem = $(elem);

	grades.push({
		course_name: elem.find('div.span8>h4').text().slice(0, -1),
		power_pace: elem.find('div.span1.text-right.out-of:eq(0)').text().split('/').map(function(elem) { return parseInt(elem, 10); }),
		additional_pace: elem.find('div.span1.text-right.out-of:eq(1)').text().split('/').map(function(elem) { return parseInt(elem, 10); }),
		overdue_projects: parseInt(elem.find('div.span7>b').text().replace(' projects'), 10),
		cog_skills_arr: elem.find('tbody').children().toArray().map(function(skill) {
			var skill = $(skill);

			return {
				name: skill.find('td:eq(0)').text(),
				weight: parseInt(skill.find('td:eq(1)').text(), 10),
				score: parseFloat(skill.find('td.scored').text(), 10) || 0
			};
		})
	});
});

document.body.innerHTML = raw.html();
$('style').remove();
$('title').text('Summit PLP | My Future');

$(document).on('click', 'td.indicator', function() {
	var self = $(this);

	self.parent().find('td.indicator.scored').toggleClass('scored');
	self.toggleClass('scored');
});

$(document).on('click', 'tbody>tr>td:nth-child(2)', function() {
	var self = $(this);

	self.replaceWith($('<input>').css({ width: '65px', height: '29px', margin: '0px', padding: '0px' }).val(self.text()));
});

$(document).on('blur', 'tbody>tr>input', function() {
	var self = $(this);

	console.log('asds');
	self.replaceWith('<td>' + self.val() + '</td>');
});
