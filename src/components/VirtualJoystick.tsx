import React from 'react';
import { TouchControls, TouchControlsProps } from './TouchControls';

export type VirtualJoystickProps = TouchControlsProps;

export const VirtualJoystick: React.FC<VirtualJoystickProps> = (props) => {
  return <TouchControls {...props} />;
};
