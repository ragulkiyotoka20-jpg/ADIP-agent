import React from 'react';
import {Composition} from 'remotion';
import {IncidentTimeMachine} from './IncidentTimeMachine';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="IncidentTimeMachine"
      component={IncidentTimeMachine}
      durationInFrames={1980}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
