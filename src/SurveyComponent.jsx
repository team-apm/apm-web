import React, { Component } from "react";
import * as Survey from "survey-react";
import "survey-react/survey.css";
import "./index.css";
import surveyJson from './data/survey.json';

Survey.StylesManager.applyTheme("default");

class SurveyComponent extends Component {
    render() {
        const survey = new Survey.Model(surveyJson);

        return (
            <Survey.Survey
                model={survey}
            />
        );
    }
}

export default SurveyComponent;
