/*
 * Don't forget to precompile to precompiled-user.js using
 * http://facebook.github.io/react/jsx-compiler.html.
 */

$('title').text('Summit PLP | My Future');
$('style').remove();

function getCourses() {
	courses = [];
	$('<body></body>').append($.ajax({ type: 'GET', url: 'https://app.mysummitps.org/my/grades', async: false }).responseText).find('div.course.boxed').toArray().forEach(function(elem) {
		elem = $(elem);
		var skill_id = 0;

		courses.push({
			id: courses.length,
			name: elem.find('div.span8>h4').text().slice(0, -1),
			power_pace: elem.find('div.span1.text-right.out-of:eq(0)').text().split('/').map(function(elem) { return parseInt(elem, 10); }),
			additional_pace: elem.find('div.span1.text-right.out-of:eq(1)').text().split('/').map(function(elem) { return parseInt(elem, 10); }),
			overdue_projects: parseInt(elem.find('div.span7>b').text().replace(' projects'), 10),
			cog_skills: elem.find('tbody').children().toArray().map(function(skill) {
				var skill = $(skill);

				return {
					id: skill_id++,
					name: skill.find('td:eq(0)').text(),
					weight: parseInt(skill.find('td:eq(1)').text(), 10),
					score: parseFloat(skill.find('td.scored').text(), 10) || 0
				};
			})
		});
	});

	localStorage.setItem('old_courses', JSON.stringify(courses));
}

courses = JSON.parse(localStorage.getItem('old_courses') || 'null');
if (courses === null) {
	getCourses();
}

var Skill = React.createClass({
	buildTD: function(number) {
		return <td className={'indicator ' + (this.props.skill.score === number ? 'scored' : '' )} onClick={this.props.onCogGradeChange}>{number}</td>
	},
	render: function() {
		return (
			<tr>
				<td>{this.props.skill.name}</td>
				<td style={{ margin: '0px', padding: '0px' }}><input style={{ height: '100%', width: '54px', margin: '0px', padding: '0px', border: 'none' }} value={this.props.skill.weight} onChange={this.props.onCogWeightChange} /></td>
				{[1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8].map(this.buildTD)}
			</tr>
		);
	}
});

var Course = React.createClass({
	getInitialState: function() {
		var state = {};
		state.course = this.props.course;
		state.cog_avg = this.cog_avg(state.course.cog_skills);
		state.cog_percentage = Math.round((15 * (state.cog_avg - 5) + 70));
		state.power_percentage = Math.round(state.course.power_pace[0] / (state.course.power_pace[1] || 1) * 100);
		state.additional_percentage = Math.round(state.course.additional_pace[0] / (state.course.additional_pace[1] || 1) * 100);
		state.total_percentage = Math.round(state.cog_percentage * 0.7 + state.power_percentage * 0.21 + state.additional_percentage * 0.09);
		state.total_grade = this.letter_grade(state.total_percentage);

		return state;
	},
	updateState: function(children) {
		var newstate = {};

		children.forEach((function(child) {
			switch (child) {
				case 'course': {
					newstate.course = this.state.course;
					break;
				}

				case 'cog_avg': {
					this.state.cog_avg = this.cog_avg(this.state.course.cog_skills);
					newstate.cog_avg = this.state.cog_avg;
					break;
				}

				case 'cog_percentage': {
					this.state.cog_percentage = Math.round(15 * (+this.state.cog_avg - 5) + 70);
					newstate.cog_percentage = this.state.cog_percentage;
					break;
				}

				case 'power_percentage': {
					var retval = Math.round((+this.state.course.power_pace[0] || 0) / (+this.state.course.power_pace[1] || 0) * 100);
					isNaN(retval) && (retval = 100);

					this.state.power_percentage = retval;
					newstate.retval = this.state.retval;
					break;
				}

				case 'additional_percentage': {
					var retval = Math.round((+this.state.course.additional_pace[0] || 0) / (+this.state.course.additional_pace[1] || 0) * 100);
					isNaN(retval) && (retval = 100);

					this.state.additional_percentage = retval;
					newstate.additional_percentage = this.state.additional_percentage;
					break;
				}

				case 'total_percentage': {
					this.state.total_percentage = Math.round(+this.state.cog_percentage * 0.7 + +this.state.power_percentage * 0.21 + +this.state.additional_percentage * 0.09);
					newstate.total_percentage = this.state.total_percentage;
					break;
				}

				case 'total_grade': {
					this.state.total_grade = this.letter_grade(+this.state.total_percentage);
					newstate.total_grade = this.state.total_grade;
					break;
				}
			}
		}).bind(this));

		this.setState(newstate);
	},
	cog_avg: function(skills) {
		var cog_total = 0,
			weight_total = 0;

		for (var i = 0; i < skills.length; i++) {
			cog_total += (+skills[i].score || 0) * (+skills[i].weight || 0);
			weight_total += (+skills[i].weight || 0);
		}

		if (weight_total === 0) {
			return 7;
		}

		return Math.round(cog_total / weight_total * 100) / 100;
	},
	letter_grade: function(percentage) {
		var plusminus = percentage % 10;
		var abcf = (percentage - (plusminus)) / 10;
		var grade = '';

		if (abcf > 9) {
			return 'A+';
		} else if (abcf > 8) {
			grade = 'A';
		} else if (abcf > 7) {
			grade = 'B';
		} else if (abcf > 6) {
			grade = 'C';
		} else {
			return 'Incomplete';
		}

		if (plusminus < 4) {
			grade += '-';
		} else if (plusminus > 6) {
			grade += '+';
		}

		return grade;
	},
	onCogGradeChange: function(skill, e) {
		this.state.course.cog_skills[skill.id].score = +e.target.innerHTML || 0;
		this.updateState(['course', 'cog_avg', 'cog_percentage', 'total_percentage', 'total_grade']);
	},
	onCogWeightChange: function(skill, e) {
		this.state.course.cog_skills[skill.id].weight = e.target.value;
		this.updateState(['course', 'cog_avg', 'cog_percentage', 'total_percentage', 'total_grade']);
	},
	onAssessmentChange: function(type, e) {
		this.state.course[type + '_pace'][0] = e.target.value;
		this.updateState(['course', type + '_percentage', 'total_percentage', 'total_grade']);
	},
	buildSkill: function(skill) {
		return <Skill skill={skill} onCogGradeChange={this.onCogGradeChange.bind(this, skill)} onCogWeightChange={this.onCogWeightChange.bind(this, skill)} />;
	},
	render: function() {
		return (
			<div className="course boxed">
				<div className="row-fluid show-hide-details">
					<div className="span8"><h4>{this.state.course.name}:</h4></div>
					<div className="span2 text-right"><h4 className="course-score">{this.state.total_percentage}%</h4></div>
					<div className="span2"><h4 className="course-grade">{this.state.total_grade}</h4></div>
				</div>
				<div className="row-fluid details"><div className="span7">You have <b>{this.state.course.overdue_projects} {this.state.course.overdue_projects === 1 ? 'project' : 'projects'}</b> overdue.</div></div>
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
									<th></th>
									<th></th>
									<th colSpan={15}>
										<div className="cog-skill-avg" style={{ position: 'relative', left: 'calc( ' + this.state.cog_percentage + '% - 20% )' }}>{this.state.cog_avg.toFixed(2)}</div>
									</th>
								</tr>
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
								{this.state.course.cog_skills.map(this.buildSkill)}
							</tbody>
						</table>
					</div>
				</div>
				<div className="focus-areas details power-true grade-component">
					<div className="row-fluid">
						<div className="span7">For your <strong>power</strong> focus areas, you are on pace to complete:</div>
						<div className="span1 text-right out-of">
							<input value={this.state.course.power_pace[0]} style={{ width: '20px', border: 'none', textAlign: 'right' }} onChange={this.onAssessmentChange.bind(this, 'power')} />
							&#47; {this.state.course.power_pace[1]}
						</div>
						<div className="span2 text-right pcnt">{this.state.power_percentage}%</div>
					</div>
				</div>
				<div className="focus-areas details power-false grade-component">
					<div className="row-fluid">
						<div className="span7">For your <strong>additional</strong> focus areas, you are on pace to complete:</div>
						<div className="span1 text-right out-of">
							<input value={this.state.course.additional_pace[0]} style={{ width: '20px', border: 'none', textAlign: 'right' }} onChange={this.onAssessmentChange.bind(this, 'additional')} />
							&#47; {this.state.course.additional_pace[1]}
						</div><div className="span2 text-right pcnt">{this.state.additional_percentage}%</div>
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
	resetGrades: function() {
		getCourses();
		window.location.reload();
	},
	buildCourse: function(course) {
		return <Course course={course} />;
	},
	render: function() {
		return (
			<div id="students-next-grades" className="container-fluid students-next-year" style={{ marginTop: '20px' }}>
				<p className="warning">
					<em style={{ color: 'red' }}>These grades may not represent your current grades.</em>
					&nbsp; &nbsp;
					<button onClick={this.resetGrades}>Reset&#47;Update Grades</button>
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
