/*
 * Don't forget to precompile to precompiled-user.js using
 * http://facebook.github.io/react/jsx-compiler.html.
 */

$('title').text('Summit PLP | My Future');
$('style').remove();

courses = [];
$('<body></body>').append($.ajax({ type: 'GET', url: 'https://app.mysummitps.org/my/grades', async: false }).responseText).find('div.course.boxed').toArray().forEach(function(elem) {
	elem = $(elem);

	courses.push({
		name: elem.find('div.span8>h4').text().slice(0, -1),
		power_pace: elem.find('div.span1.text-right.out-of:eq(0)').text().split('/').map(function(elem) { return parseInt(elem, 10); }),
		additional_pace: elem.find('div.span1.text-right.out-of:eq(1)').text().split('/').map(function(elem) { return parseInt(elem, 10); }),
		overdue_projects: parseInt(elem.find('div.span7>b').text().replace(' projects'), 10),
		cog_skills: elem.find('tbody').children().toArray().map(function(skill) {
			var skill = $(skill);

			return {
				name: skill.find('td:eq(0)').text(),
				weight: parseInt(skill.find('td:eq(1)').text(), 10),
				score: parseFloat(skill.find('td.scored').text(), 10) || 0
			};
		})
	});
});

var Skill = React.createClass({
	buildTD: function(number) {
		return <td className={'indicator ' + (this.props.skill.score === number ? 'scored' : '' )}>{number}</td>
	},
	render: function() {
		return (
			<tr>
				<td>{this.props.skill.name}</td>
				<td>{this.props.skill.weight}</td>
				{[1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8].map(this.buildTD)}
			</tr>
		);
	}
});

var Course = React.createClass({
	getInitialState: function() {
		var state = {};
		state.cog_avg = this.cog_avg(this.props.course.cog_skills);
		state.cog_percentage = Math.round((15 * (state.cog_avg - 5) + 70));
		state.power_percentage = Math.round(this.props.course.power_pace[0] / (this.props.course.power_pace[1] || 1) * 100);
		state.additional_percentage = Math.round(this.props.course.additional_pace[0] / (this.props.course.additional_pace[1] || 1) * 100);
		state.total_percentage = Math.round(state.cog_percentage * 0.7 + state.power_percentage * 0.21 + state.additional_percentage * 0.09);
		state.total_grade = this.letter_grade(state.total_percentage)

		return state;
	},
	cog_avg: function(skills) {
		var cog_total = 0,
			weight_total = 0;

		for (var i = 0; i < skills.length; i++) {
			cog_total += skills[i].score * skills[i].weight;
			weight_total += skills[i].weight;
		}

		return Math.round(cog_total / (weight_total || 1) * 100) / 100;
	},
	letter_grade: function(percentage) {
		var plusminus = percentage % 10;
		var abcf = (percentage - (plusminus)) / 10;
		var grade = '';

		if (abcf > 8) {
			grade = 'A';
		} else if (abcf > 7) {
			grade = 'B';
		} else if (abcf > 6) {
			grade = 'C';
		} else {
			grade = 'Incomplete';
		}

		if (plusminus < 4) {
			grade += '-';
		} else if (plusminus > 6) {
			grade += '+';
		}

		return grade;
	},
	buildSkill: function(skill) {
		return <Skill skill={skill} />;
	},
	render: function() {
		return (
			<div className="course boxed">
				<div className="row-fluid show-hide-details">
					<div className="span8"><h4>{this.props.course.name}:</h4></div>
					<div className="span2 text-right"><h4 className="course-score">{this.state.total_percentage}%</h4></div>
					<div className="span2"><h4 className="course-grade">{this.state.total_grade}</h4></div>
				</div>
				<div className="row-fluid details"><div className="span7">You have <b>{this.props.course.overdue_projects} {this.props.course.overdue_projects === 1 ? 'project' : 'projects'}</b> overdue.</div></div>
				<div className="row-fluid details show-hide-cog-skills grade-component">
					<div className="span7">For your <strong>cognitive skills</strong>, you have an average of:</div>
					<div className="span1 cog-avg text-right">{this.state.cog_avg}</div>
					<div className="span2 text-right cog-pcnt">{this.state.cog_percentage}%</div>
				</div>
				<div className="row-fluid cog-skills-row show-hide-cog-skills">
					<div className="cog-skills span8">
						<table className="table table-bordered table-condensed scores-table">
							<thead>
								<tr>
									<th>Cognitive Skill</th>
									<th>Weight</th>
									<th></th>
									<th></th>
									<th></th>
									<th></th>
									<th></th>
									<th></th>
									<th></th>
									<th></th>
									<th className="indicator">C-</th>
									<th></th>
									<th></th>
									<th></th>
									<th className="indicator">A+</th>
									<th></th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{this.props.course.cog_skills.map(this.buildSkill)}
							</tbody>
						</table>
					</div>
				</div>
				<div className="focus-areas details power-true grade-component">
					<div className="row-fluid">
						<div className="span7">For your <strong>power</strong> focus areas, you are on pace to complete:</div>
						<div className="span1 text-right out-of">{this.props.course.power_pace[0] + '/' + this.props.course.power_pace[1]}</div>
						<div className="span2 text-right pcnt">{this.state.power_percentage}%</div>
					</div>
				</div>
				<div className="focus-areas details power-false grade-component">
					<div className="row-fluid">
						<div className="span7">For your <strong>additional</strong> focus areas, you are on pace to complete:</div>
						<div className="span1 text-right out-of">{this.props.course.additional_pace[0] + '/' + this.props.course.additional_pace[1]}</div>
						<div className="span2 text-right pcnt">{this.state.additional_percentage}%</div>
					</div>
				</div>
			</div>
		);
	}
});

var App = React.createClass({
	getInitialState: function() {
		return {
			courses: courses
		};
	},
	changeCogGrade: function(e) {
		console.log(e.target);
	},
	buildCourse: function(course) {
		return <Course course={course} changeCogGrade={this.changeCogGrade} />;
	},
	render: function() {
		return (
			<div id="students-next-grades" className="container-fluid students-next-year" style={{ marginTop: '20px' }}>
				<p className="warning">
					<em style={{ color: 'red' }}>These grades may not represent your current grades.</em>
					&nbsp; &nbsp;
					<button>Reset Grades</button>
				</p>
				{this.state.courses.map(this.buildCourse)}
			</div>
		);
	}
});

React.render(
	<App />,
	$('body').html('').get(0)
);
