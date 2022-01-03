import React, { useState, useEffect } from "react";
import * as Survey from "survey-react";
import "survey-react/survey.css";
import "./index.css";
import surveyJson from './data/survey.json';

Survey.StylesManager.applyTheme("default");

function SurveyComponent(props) {
    const [survey, setSurvey] = useState();

    useEffect(() => {
        const preData = props.packageItem;
        if (!preData) {
            setSurvey();
            return;
        }

        // convert
        preData.dependencies = preData?.dependencies.dependency.join('\r\n');
        if (preData?.releases) {
            const tmpReleases = [];
            for (const [key, value] of Object.entries(preData.releases)) {
                tmpReleases.push({ version: key, integrities: value.integrities });
            }
            preData.releases = tmpReleases;
        }

        const survey = new Survey.Model(surveyJson);
        survey.data = preData;
        survey.onComplete.add((s, o) => {
            const newData = s.data;

            // convert
            if (newData?.dependencies)
                newData.dependencies = { dependency: newData?.dependencies.trim().split(/\r\n/) };
            if (newData?.releases) {
                const tmpReleases = {};
                for (const entry of newData.releases) {
                    tmpReleases[entry.version] = { integrities: entry.integrities };
                }
                newData.releases = tmpReleases;
            }


            console.log(newData);
        });

        setSurvey(survey);
    }, [props.packageItem]);

    return (
        <div>{survey &&
            <Survey.Survey
                model={survey}
            />}
        </div>
    );
}

export default SurveyComponent;
