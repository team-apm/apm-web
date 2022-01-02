import React, { Component } from "react";
import * as Survey from "survey-react";
import "survey-react/survey.css";
import "./index.css";
import surveyJson from './data/survey.json';
import { PackagesList } from './parseXML';

Survey.StylesManager.applyTheme("default");

class SurveyComponent extends Component {
    render() {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', "https://cdn.jsdelivr.net/gh/hal-shu-sato/apm-data@main/v2/data/packages.xml", false);
        xhr.send();
        const packages = new PackagesList(xhr.response);
        const preData = packages['ePi/patch'];

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

        return (
            <Survey.Survey
                model={survey}
            />
        );
    }
}

export default SurveyComponent;
