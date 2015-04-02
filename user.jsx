var FOREACH_BREAK = '\0000&&AND&&_____foreach_break__\0\0';

$('title').text('Summit PLP | My Future');
$('style').remove();

var utils = {
	cog_avg: function(skills) {
		var cog_total = 0,
			weight_total = 0;

		for (var i = 0; i < skills.length; i++) {
			cog_total += (+skills[i].score || 0) * (+skills[i].weight || 0);
			weight_total += (+skills[i].weight || 0);
		}

		if (weight_total === 0) {
			return (12 - utils.grade_level);
		}

		return cog_total / weight_total;
	},
	cog_percentage: function(cog_avg, grade_level) {
		return 15 * (cog_avg - (((grade_level || 9) - 6) * 0.5 + 2)) + 70;
	},
	letter_grade: function(percentage) {
		var plusminus = percentage % 10;
		var abci = (percentage - plusminus) / 10;
		var grade = '';

		if (abci > 9) {
			return 'A+';
		} else if (abci > 8) {
			grade = 'A';
		} else if (abci > 7) {
			grade = 'B';
		} else if (abci > 6) {
			grade = 'C';
		} else {
			return 'Incomplete';
		}

		if (plusminus < 3) {
			grade += '-';
		} else if (plusminus > 6) {
			grade += '+';
		}

		return grade;
	},
	getGradeLevel: function(courses) {
		if (!courses || !courses.length) {
			return 9;
		}

		var grade_level = 9;

		try {
			courses.forEach(function(course) {
				if (course.name === 'English 6') {
					grade_level = 6;
					throw FOREACH_BREAK;
				} else if (course.name === 'English 7') {
					grade_level = 7;
					throw FOREACH_BREAK;
				} else if (course.name === 'English 8') {
					grade_level = 8;
					throw FOREACH_BREAK;
				} else if (course.name === 'English 9') {
					grade_level = 9;
					throw FOREACH_BREAK;
				} else if (course.name === 'English 10') {
					grade_level = 10;
					throw FOREACH_BREAK;
				} else if (course.name === 'AP English Language') {
					grade_level = 11;
					throw FOREACH_BREAK;
				} else if (course.name === 'AP English Literature') {
					grade_level = 12;
					throw FOREACH_BREAK;
				}
			});
		} catch (e) {
			if (e !== FOREACH_BREAK) {
				throw e;
			}
		}

		return grade_level;
	},
	getCourses: function() {
		var courses = [];
		$('<body></body>')
			.append(
				$.ajax({
					type: 'GET',
					url: 'https://app.mysummitps.org/my/grades',
					async: false,
					error: function() {
						alert('There was an error fetching your grades. Have you logged in?');
						window.setTimeout(function() {
							window.location.href = '/';
						}, 1);
					}
				}).responseText
			)
			.find('div.course.boxed').toArray().forEach(function(elem) {
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
		return courses;
	}
};
utils.courses = JSON.parse(localStorage.getItem('old_courses') || 'null') || utils.getCourses();
utils.grade_level = utils.getGradeLevel(utils.courses);

var Skill = React.createClass({
	buildTD: function(number) {
		return <td key={'grade.' + number} className={'indicator ' + (this.props.skill.score === number ? 'scored' : '' )} onClick={this.props.onCogGradeChange}>{number}</td>
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
		state.cog_avg = utils.cog_avg(state.course.cog_skills);
		state.cog_percentage = utils.cog_percentage(state.cog_avg, utils.grade_level);
		state.power_percentage = state.course.power_pace[1] === 0 ? 100 : ((state.course.power_pace[0] || 1) / (state.course.power_pace[1]) * 100);
		state.additional_percentage = state.course.additional_pace[1] === 0 ? 100 : ((state.course.additional_pace[0] || 1) / (state.course.additional_pace[1]) * 100);
		state.power_on_track = state.power_percentage >= 100;
		state.total_percentage = state.cog_percentage * 0.7 + (state.power_on_track ? 21 : 0) + state.additional_percentage * 0.09;
		state.total_grade = (state.power_percentage < 100 || state.course.overdue_projects > 0) ? 'Incomplete' : utils.letter_grade(state.total_percentage);
		state.hidden = true;

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
					this.state.cog_avg = utils.cog_avg(this.state.course.cog_skills);
					newstate.cog_avg = this.state.cog_avg;
					break;
				}

				case 'cog_percentage': {
					this.state.cog_percentage = utils.cog_percentage(+this.state.cog_avg, utils.grade_level);
					newstate.cog_percentage = this.state.cog_percentage;
					break;
				}

				case 'power_percentage': {
					this.state.power_percentage = +this.state.course.power_pace[1] === 0 ? 100 : ((+this.state.course.power_pace[0] || 1) / (+this.state.course.power_pace[1]) * 100);
					newstate.power_percentage = this.state.power_percentage;
					break;
				}

				case 'additional_percentage': {
					this.state.additional_percentage = +this.state.course.additional_pace[1] === 0 ? 100 : ((+this.state.course.additional_pace[0] || 1) / (+this.state.course.additional_pace[1]) * 100);
					newstate.additional_percentage = this.state.additional_percentage;
					break;
				}

				case 'power_on_track': {
					this.state.power_on_track = this.state.power_percentage >= 100;
					newstate.power_on_track = this.state.power_on_track;
					break;
				}

				case 'total_percentage': {
					this.state.total_percentage = +this.state.cog_percentage * 0.7 + (this.state.power_on_track ? 21 : 0) + +this.state.additional_percentage * 0.09;
					newstate.total_percentage = this.state.total_percentage;
					break;
				}

				case 'total_grade': {
					this.state.total_grade = (this.state.power_percentage < 100 || this.state.course.overdue_projects > 0) ? 'Incomplete' : utils.letter_grade(+this.state.total_percentage);
					newstate.total_grade = this.state.total_grade;
					break;
				}
			}
		}).bind(this));

		this.setState(newstate);
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
		this.updateState(['course', type + '_percentage', 'power_on_track', 'total_percentage', 'total_grade']);
	},
	buildSkill: function(skill, defaults) {
		return <Skill key={'skill.' + skill.name.replace(/[\s]/g, '')} skill={skill} onCogGradeChange={this.onCogGradeChange.bind(this, skill)} onCogWeightChange={this.onCogWeightChange.bind(this, skill)} />;
	},
	toggleHideCourse: function(event) {
		this.setState({ hidden: !this.state.hidden });
	},
	render: function() {
		return (
			<div className="course boxed">
				<div className="row-fluid show-hide-details" onClick={this.toggleHideCourse} style={{ 'cursor': 'pointer' }}>
					<div className="span8"><h4>{this.state.course.name}:</h4></div>
					<div className="span2 text-right"><h4 className="course-score">{Math.round(this.state.total_percentage)}%</h4></div>
					<div className="span2"><h4 className="course-grade">{this.state.total_grade}</h4></div>
				</div>
				<div className={"row-fluid details" + (this.state.hidden ? ' hide' : '')}><div className="span7">You have <b>{this.state.course.overdue_projects} {this.state.course.overdue_projects === 1 ? 'project' : 'projects'}</b> overdue.</div></div>
				<div className={"row-fluid details show-hide-cog-skills grade-component" + (this.state.hidden ? ' hide' : '')}>
					<div className="span7">For your <strong>cognitive skills</strong>, you have an average of:</div>
					<div className="span1 cog-avg text-right">{Math.round(this.state.cog_avg * 100) / 100}</div>
					<div className="span2 text-right cog-pcnt">{Math.round(this.state.cog_percentage)}%</div>
				</div>
				<div className={"row-fluid cog-skills-row show-hide-cog-skills" + (this.state.hidden ? ' hide' : '')}>
					<div className="cog-skills span8">
						<table className="table table-bordered table-condensed scores-table">
							<thead>
								<tr>
									<th></th>
									<th></th>
									<th colSpan={15}>
										<div className="cog-skill-avg" style={{ position: 'relative', left: 'calc( ' + this.state.cog_percentage + '% - 20% )' }}>{Math.round(this.state.cog_avg)}</div>
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
				<div className={"focus-areas details power-true grade-component" + (this.state.hidden ? ' hide' : '')}>
					<div className="row-fluid">
						<div className="span7">For your <strong>power</strong> focus areas, you are on pace to complete:</div>
						<div className="span1 text-right out-of">
							<input value={this.state.course.power_pace[0]} style={{ width: '20px', border: 'none', textAlign: 'right' }} onChange={this.onAssessmentChange.bind(this, 'power')} />
							&#47; {this.state.course.power_pace[1]}
						</div>
						<div className="span2 text-right pcnt">{Math.round(this.state.power_percentage)}%</div>
					</div>
				</div>
				<div className={"focus-areas details power-false grade-component" + (this.state.hidden ? ' hide' : '')}>
					<div className="row-fluid">
						<div className="span7">For your <strong>additional</strong> focus areas, you are on pace to complete:</div>
						<div className="span1 text-right out-of">
							<input value={this.state.course.additional_pace[0]} style={{ width: '20px', border: 'none', textAlign: 'right' }} onChange={this.onAssessmentChange.bind(this, 'additional')} />
							&#47; {this.state.course.additional_pace[1]}
						</div><div className="span2 text-right pcnt">{Math.round(this.state.additional_percentage)}%</div>
					</div>
				</div>
			</div>
		);
	}
});

var App = React.createClass({
	getInitialState: function() {
		return {
			courses: utils.courses
		};
	},
	resetGrades: function() {
		this.setState({ courses: utils.getCourses() });

		$('body').css('background', 'black');
		window.setTimeout(function() {
			$('body').css('background', 'white');
		}, 100);
	},
	buildCourse: function(course) {
		return <Course key={'course.' + course.name.replace(/[\s]/g, '')} course={course} />;
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
