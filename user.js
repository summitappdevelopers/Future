// Custom break message for the forEach function.
var FOREACH_BREAK = '\0000&&AND&&_____foreach_break__\0\0';

// Remove all styles and change the 404 title.
$('title').text('Summit PLP | My Future');
$('style').remove();

// Polyfill hack to get rid of all rounding for testing.
// Math.round = function(a) { return a; }

var utils = {
	// Calculates the cog average from all the skills.
	// To do this, use the following algorithm:
	// 	For each cog skill dimension that's been added:
	// 		Multiple the number of times it has been scored * the highest score the student has gotten
	//	Add all of those up
	// 	Add up the total number of times all the skills has been assessed in this course
	// 	Divide the first one by the second
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
	// Converts the cog average to a percentage.
	// To convert that raw average into a percentage, you also need to know the student's grade level.
	// 	Formula:
	// 		pcnt = 15 * (raw - seventy_pcnt_score) + 70
	// 	Where `raw` is what you computed in step 1 and seventy_pcnt_score is from this table:
	// 	The cog skills component is computed based on the grade level of the course:
	// 	+–––––––––––––+––––––––––––––––––––+––––––––––––––––––––––––––––+––––––––––––––––––––––––––––––+
	// 	| Grade Level | seventy_pcnt_score | B, 85%, Cog Skills Average | A+, 100%, Cog Skills Average |
	// 	+–––––––––––––+––––––––––––––––––––+––––––––––––––––––––––––––––+––––––––––––––––––––––––––––––+
	// 	|     6th     |          2         |              3             |             4                |
	// 	|     7th     |         2.5        |             3.5            |            4.5               |
	// 	|     8th     |          3         |              4             |             5                |
	// 	|     9th     |         3.5        |             4.5            |            5.5               |
	// 	|    10th     |          4         |              5             |             6                |
	// 	|    11th     |         4.5        |             5.5            |            6.5               |
	// 	|    12th     |          5         |              6             |             7                |
	// 	+–––––––––––––+––––––––––––––––––––+––––––––––––––––––––––––––––+––––––––––––––––––––––––––––––+
	cog_percentage: function(cog_avg, grade_level) {
		return 15 * (cog_avg - (((grade_level || 9) - 6) * 0.5 + 2)) + 70;
	},
	// Calculates the total course percentage.
	// To do that, use the following algorithm:
	// 	Add the following:
	// 		Multiply the cog percentage by 0.7 (70% of grade).
	// 		If powers are on track for 100%, add 21% to the grade. Otherwise, add nothing.
	// 		Multiply the additional percentage by 0.09 (9% of grade).
	total_percentage: function(power_on_track, cog_percentage, additional_percentage) {
		return cog_percentage * 0.7 + (power_on_track ? 21.0 : 0.0) + additional_percentage * 0.09
	},
	// Converts a percentage to a letter grade.
	// To do that, we need the ones and tens digit.
	//
	// If the tens digit is greater than 9 (100%+), automatic A+.
	// If the tens digit is greater than 8 (90-99%), their base grade is A.
	// If the tens digit is greater than 7 (80-89%), their base grade is B.
	// If the tens digit is greater than 6 (70-79%), their base grade is C.
	//
	// If the ones digit is less than 3, they get a minus.
	// 	Ex: 92% --> 2 < 3 === true --> A-.
	// If the tens digit is greater than 6, they get a plus.
	// 	Ex: 97% --> 7 > 6 === true --> A+.
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
	// Deduce the student's grade level.
	// This is possible by looking at the student's English course.
	// English is the only continuum where each grade gets a mandatory course where the name is unique.
	// We can just test the course names for matches to grade-specific English course names.
	getGradeLevel: function(courses) {
		// Make sure courses is defined and is an array.
		if (!courses || !courses.length) {
			return 6;
		}

		var grade_level = 6;

		// I should switch to just a plain for() loop.
		// The only way to break a forEach loop is by throwing something, catching it, and discarding the value.
		// To be safe, throw a very unique string so we know that we did not catch an actual error.
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
				// We caught another error and should pass it along.
				throw e;
			}
		}

		return grade_level;
	},
	// Gets course data by scraping the grades page.
	getCourses: function() {
		var courses = [];

		// Create a fake body in jQuery where we will store jQuery-parseable HTML we got.
		$('<body></body>')
			.append(
				// Get the HTML from /my/grades and append it in the fake body.
				$.ajax({
					type: 'GET',
					url: '/my/grades',
					async: false, // This is detrimental to the UX but removes a lot of work.
					error: function() {
						// There was some error fetching grades (maybe they did not log in).
						alert('There was an error fetching your grades. Have you logged in?');
						window.setTimeout(function() {
							window.location.href = '/';
						}, 1);
					}
				}).responseText
			)
			// Find each course and get the course data out of it.
			.find('div.course.boxed').toArray().forEach(function(elem) {
				elem = $(elem);
				var skill_id = 0; // Unique (per course) skill ids.

				// Get the goods.
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

		// Set localStorage item so we don't have to scrape each time.
		// Do this mainly because it takes some time to scrape the page (which is detrimental to UX).
		localStorage.setItem('old_courses', JSON.stringify(courses));
		return courses;
	}
};

// We don't put this stuff in React right now because I'm trying to get things organized.

// Get the courses.
utils.courses = JSON.parse(localStorage.getItem('old_courses') || 'null') || utils.getCourses();
// Grade level is not stored in <App />.state because we would have to rerender every
utils.grade_level = utils.getGradeLevel(utils.courses);

var Skill = React.createClass({displayName: "Skill",
	buildTD: function(number) {
		return React.createElement("td", {key: 'grade.' + number, className: 'indicator ' + (this.props.skill.score === number ? 'scored' : ''), onClick: this.props.onCogGradeChange}, number)
	},
	render: function() {
		return (
			React.createElement("tr", null, 
				React.createElement("td", null, this.props.skill.name), 
				React.createElement("td", {style: { margin: '0px', padding: '0px'}}, React.createElement("input", {style: { height: '100%', width: '54px', margin: '0px', padding: '0px', border: 'none'}, value: this.props.skill.weight, onChange: this.props.onCogWeightChange})), 
				[1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8].map(this.buildTD)
			)
		);
	}
});

var Course = React.createClass({displayName: "Course",
	getInitialState: function() {
		var state = {};
		state.course = this.props.course;
		state.cog_avg = utils.cog_avg(state.course.cog_skills);
		state.cog_percentage = utils.cog_percentage(state.cog_avg, utils.grade_level);
		state.power_percentage = state.course.power_pace[1] === 0 ? 100 : ((state.course.power_pace[0] || 1) / (state.course.power_pace[1]) * 100);
		state.additional_percentage = state.course.additional_pace[1] === 0 ? 100 : ((state.course.additional_pace[0] || 1) / (state.course.additional_pace[1]) * 100);
		state.power_on_track = state.power_percentage >= 70;
		state.total_percentage = state.cog_percentage * 0.7 + (state.power_on_track ? 21.0 : 0.0) + state.additional_percentage * 0.09;
		state.total_grade = (state.power_percentage < 70 || state.course.overdue_projects > 0) ? 'Incomplete' : utils.letter_grade(state.total_percentage);
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
					this.state.power_on_track = this.state.power_percentage >= 70;
					newstate.power_on_track = this.state.power_on_track;
					break;
				}

				case 'total_percentage': {
					this.state.total_percentage = +this.state.cog_percentage * 0.7 + (this.state.power_on_track ? 21.0 : 0.0) + +this.state.additional_percentage * 0.09;
					newstate.total_percentage = this.state.total_percentage;
					break;
				}

				case 'total_grade': {
					this.state.total_grade = (this.state.power_percentage < 70 || this.state.course.overdue_projects > 0) ? 'Incomplete' : utils.letter_grade(+this.state.total_percentage);
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
		return React.createElement(Skill, {key: 'skill.' + skill.name.replace(/[\s]/g, ''), skill: skill, onCogGradeChange: this.onCogGradeChange.bind(this, skill), onCogWeightChange: this.onCogWeightChange.bind(this, skill)});
	},
	toggleHideCourse: function(event) {
		this.setState({ hidden: !this.state.hidden });
	},
	render: function() {
		return (
			React.createElement("div", {className: "course boxed"}, 
				React.createElement("div", {className: "row-fluid show-hide-details", onClick: this.toggleHideCourse, style: { 'cursor': 'pointer'}}, 
					React.createElement("div", {className: "span8"}, React.createElement("h4", null, this.state.course.name, ":")), 
					React.createElement("div", {className: "span2 text-right"}, React.createElement("h4", {className: "course-score"}, Math.round(this.state.total_percentage), "%")), 
					React.createElement("div", {className: "span2"}, React.createElement("h4", {className: "course-grade"}, this.state.total_grade))
				), 
				React.createElement("div", {className: "row-fluid details" + (this.state.hidden ? ' hide' : '')}, React.createElement("div", {className: "span7"}, "You have ", React.createElement("b", null, this.state.course.overdue_projects, " ", this.state.course.overdue_projects === 1 ? 'project' : 'projects'), " overdue.")), 
				React.createElement("div", {className: "row-fluid details show-hide-cog-skills grade-component" + (this.state.hidden ? ' hide' : '')}, 
					React.createElement("div", {className: "span7"}, "For your ", React.createElement("strong", null, "cognitive skills"), ", you have an average of:"), 
					React.createElement("div", {className: "span1 cog-avg text-right"}, Math.round(this.state.cog_avg * 100) / 100), 
					React.createElement("div", {className: "span2 text-right cog-pcnt"}, Math.round(this.state.cog_percentage), "%")
				), 
				React.createElement("div", {className: "row-fluid cog-skills-row show-hide-cog-skills" + (this.state.hidden ? ' hide' : '')}, 
					React.createElement("div", {className: "cog-skills span8"}, 
						React.createElement("table", {className: "table table-bordered table-condensed scores-table"}, 
							React.createElement("thead", null, 
								React.createElement("tr", null, 
									React.createElement("th", null), 
									React.createElement("th", null), 
									React.createElement("th", {colSpan: 15}, 
										React.createElement("div", {className: "cog-skill-avg", style: { position: 'relative', left: 'calc( ' + this.state.cog_percentage + '% - 20% )'}}, Math.round(this.state.cog_avg))
									)
								), 
								React.createElement("tr", null, 
									React.createElement("th", null, "Cognitive Skill"), 
									React.createElement("th", null, "Weight"), 
									React.createElement("th", null), 
									React.createElement("th", null), 
									React.createElement("th", null), 
									React.createElement("th", null), 
									React.createElement("th", null), 
									React.createElement("th", null), 
									React.createElement("th", null), 
									React.createElement("th", null), 
									React.createElement("th", {className: "indicator"}, "C-"), 
									React.createElement("th", null), 
									React.createElement("th", null), 
									React.createElement("th", null), 
									React.createElement("th", {className: "indicator"}, "A+"), 
									React.createElement("th", null), 
									React.createElement("th", null)
								)
							), 
							React.createElement("tbody", null, 
								this.state.course.cog_skills.map(this.buildSkill)
							)
						)
					)
				), 
				React.createElement("div", {className: "focus-areas details power-true grade-component" + (this.state.hidden ? ' hide' : '')}, 
					React.createElement("div", {className: "row-fluid"}, 
						React.createElement("div", {className: "span7"}, "For your ", React.createElement("strong", null, "power"), " focus areas, you are on pace to complete:"), 
						React.createElement("div", {className: "span1 text-right out-of"}, 
							React.createElement("input", {value: this.state.course.power_pace[0], style: { width: '20px', border: 'none', textAlign: 'right'}, onChange: this.onAssessmentChange.bind(this, 'power')}), 
							"/ ", this.state.course.power_pace[1]
						), 
						React.createElement("div", {className: "span2 text-right pcnt"}, Math.round(this.state.power_percentage), "%")
					)
				), 
				React.createElement("div", {className: "focus-areas details power-false grade-component" + (this.state.hidden ? ' hide' : '')}, 
					React.createElement("div", {className: "row-fluid"}, 
						React.createElement("div", {className: "span7"}, "For your ", React.createElement("strong", null, "additional"), " focus areas, you are on pace to complete:"), 
						React.createElement("div", {className: "span1 text-right out-of"}, 
							React.createElement("input", {value: this.state.course.additional_pace[0], style: { width: '20px', border: 'none', textAlign: 'right'}, onChange: this.onAssessmentChange.bind(this, 'additional')}), 
							"/ ", this.state.course.additional_pace[1]
						), React.createElement("div", {className: "span2 text-right pcnt"}, Math.round(this.state.additional_percentage), "%")
					)
				)
			)
		);
	}
});

var App = React.createClass({displayName: "App",
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
		return React.createElement(Course, {key: 'course.' + course.name.replace(/[\s]/g, ''), course: course});
	},
	render: function() {
		return (
			React.createElement("div", {id: "students-next-grades", className: "container-fluid students-next-year", style: { marginTop: '20px'}}, 
				React.createElement("p", {className: "warning"}, 
					React.createElement("em", {style: { color: 'red'}}, "These grades may not represent your current grades."), 
					"   ", 
					React.createElement("button", {onClick: this.resetGrades}, "Reset/Update Grades")
				), 
				this.state.courses.map(this.buildCourse)
			)
		);
	}
});

React.render(
	React.createElement(App, null),
	$('body').html('').get(0)
);
