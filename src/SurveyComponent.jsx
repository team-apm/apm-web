import React, { useState, useEffect, memo  } from 'react';
import * as Survey from 'survey-react';
import 'survey-react/survey.css';
import surveyJson from './data/survey.json';

Survey.StylesManager.applyTheme("bootstrap");

const SurveyComponent = memo((props) => {

  const [survey, setSurvey] = useState();

  useEffect(() => {
    if (!props.packageItem) {
      setSurvey();
      return;
    }

    const preData = JSON.parse(JSON.stringify(props.packageItem));

    // convert
    if (preData?.dependencies)
      preData.dependencies = preData.dependencies.dependency.join('\r\n');
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
        newData.dependencies = {
          dependency: newData?.dependencies.trim().split(/\r\n/),
        };
      if (newData?.releases) {
        const tmpReleases = {};
        for (const entry of newData.releases) {
          tmpReleases[entry.version] = { integrities: entry.integrities };
        }
        newData.releases = tmpReleases;
      }

      props.onComplete(newData);
    });

    setSurvey(survey);
  }, [props, props.packageItem]);

  return <div>{survey && <Survey.Survey model={survey} />}</div>;
});

export default SurveyComponent;
