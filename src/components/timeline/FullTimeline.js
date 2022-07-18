/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import * as React from 'react';
import { showMenu } from '@firefox-devtools/react-contextmenu';
import { Localized } from '@fluent/react';

import { TimelineGlobalTrack } from './GlobalTrack';
import { TimelineRuler } from './Ruler';
import { TimelineSelection } from './Selection';
import { OverflowEdgeIndicator } from './OverflowEdgeIndicator';
import { Reorderable } from 'firefox-profiler/components/shared/Reorderable';
import { withSize } from 'firefox-profiler/components/shared/WithSize';
import explicitConnect from 'firefox-profiler/utils/connect';
import {
  getCommittedRange,
  getZeroAt,
  getGlobalTracks,
  getGlobalTrackReferences,
  getHiddenTrackCount,
  getGlobalTrackOrder,
  getPanelLayoutGeneration,
} from 'firefox-profiler/selectors';
import {
  TIMELINE_MARGIN_LEFT,
  TIMELINE_MARGIN_RIGHT,
  TIMELINE_SETTINGS_HEIGHT,
} from 'firefox-profiler/app-logic/constants';
import { TimelineTrackContextMenu } from './TrackContextMenu';

import './index.css';

import type { SizeProps } from 'firefox-profiler/components/shared/WithSize';

import {
  changeGlobalTrackOrder,
  changeRightClickedTrack,
} from 'firefox-profiler/actions/profile-view';

import type {
  TrackIndex,
  GlobalTrack,
  InitialSelectedTrackReference,
  GlobalTrackReference,
  HiddenTrackCount,
  Milliseconds,
  StartEndRange,
} from 'firefox-profiler/types';

import type { ConnectedProps } from 'firefox-profiler/utils/connect';

type StateProps = {|
  +committedRange: StartEndRange,
  +globalTracks: GlobalTrack[],
  +globalTrackOrder: TrackIndex[],
  +globalTrackReferences: GlobalTrackReference[],
  +panelLayoutGeneration: number,
  +zeroAt: Milliseconds,
  +hiddenTrackCount: HiddenTrackCount,
|};

type DispatchProps = {|
  +changeGlobalTrackOrder: typeof changeGlobalTrackOrder,
  +changeRightClickedTrack: typeof changeRightClickedTrack,
|};

type Props = {|
  ...SizeProps,
  ...ConnectedProps<{||}, StateProps, DispatchProps>,
|};

type State = {|
  initialSelected: InitialSelectedTrackReference | null,
|};

class TimelineSettingsHiddenTracks extends React.PureComponent<{|
  +hiddenTrackCount: HiddenTrackCount,
  +changeRightClickedTrack: typeof changeRightClickedTrack,
|}> {
  _showMenu = (event: SyntheticMouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    this.props.changeRightClickedTrack(null);
    showMenu({
      data: null,
      id: 'TimelineTrackContextMenu',
      position: { x: rect.left, y: rect.bottom },
      target: event.target,
    });
  };

  render() {
    const { hiddenTrackCount } = this.props;

    return (
      <Localized
        id="FullTimeline--tracks-button"
        elems={{
          span: <span className="timelineSettingsHiddenTracksNumber" />,
        }}
        vars={{
          visibleTrackCount: hiddenTrackCount.total - hiddenTrackCount.hidden,
          totalTrackCount: hiddenTrackCount.total,
        }}
      >
        <button
          type="button"
          onClick={this._showMenu}
          className="timelineSettingsHiddenTracks"
        >
          <span className="timelineSettingsHiddenTracksNumber">
            {hiddenTrackCount.total - hiddenTrackCount.hidden}
          </span>
          {' / '}
          <span className="timelineSettingsHiddenTracksNumber">
            {hiddenTrackCount.total}{' '}
          </span>
          tracks
        </button>
      </Localized>
    );
  }
}

class FullTimelineImpl extends React.PureComponent<Props, State> {
  state = {
    initialSelected: null,
  };

  /**
   * This method collects the initially selected track's HTMLElement. This allows the timeline
   * to scroll the initially selected track into view once the page is loaded.
   */
  setInitialSelected = (el: InitialSelectedTrackReference) => {
    this.setState({ initialSelected: el });
  };

  render() {
    const {
      globalTracks,
      globalTrackOrder,
      changeGlobalTrackOrder,
      committedRange,
      zeroAt,
      width,
      globalTrackReferences,
      panelLayoutGeneration,
      hiddenTrackCount,
      changeRightClickedTrack,
    } = this.props;

    // Do not include the left and right margins when computing the timeline width.
    const timelineWidth = width - TIMELINE_MARGIN_LEFT - TIMELINE_MARGIN_RIGHT;

    return (
      <>
        <div
          className="timelineSettings"
          style={{
            '--timeline-settings-height': `${TIMELINE_SETTINGS_HEIGHT}px`,
          }}
        ></div>
        <TimelineSelection width={timelineWidth}>
          <div className="timelineHeader">
            <TimelineSettingsHiddenTracks
              hiddenTrackCount={hiddenTrackCount}
              changeRightClickedTrack={changeRightClickedTrack}
            />
            <TimelineRuler
              zeroAt={zeroAt}
              rangeStart={committedRange.start}
              rangeEnd={committedRange.end}
              width={timelineWidth}
            />
          </div>
          <OverflowEdgeIndicator
            className="tracksContainer timelineOverflowEdgeIndicator"
            panelLayoutGeneration={panelLayoutGeneration}
            initialSelected={this.state.initialSelected}
          >
            <Reorderable
              tagName="ol"
              className="timelineThreadList"
              grippyClassName="timelineTrackGlobalGrippy"
              order={globalTrackOrder}
              orient="vertical"
              onChangeOrder={changeGlobalTrackOrder}
            >
              {globalTracks.map((globalTrack, trackIndex) => (
                <TimelineGlobalTrack
                  key={trackIndex}
                  trackIndex={trackIndex}
                  trackReference={globalTrackReferences[trackIndex]}
                  setInitialSelected={this.setInitialSelected}
                />
              ))}
            </Reorderable>
          </OverflowEdgeIndicator>
        </TimelineSelection>
        <TimelineTrackContextMenu />
      </>
    );
  }
}

export const FullTimeline = explicitConnect<{||}, StateProps, DispatchProps>({
  mapStateToProps: (state) => ({
    globalTracks: getGlobalTracks(state),
    globalTrackOrder: getGlobalTrackOrder(state),
    globalTrackReferences: getGlobalTrackReferences(state),
    committedRange: getCommittedRange(state),
    zeroAt: getZeroAt(state),
    panelLayoutGeneration: getPanelLayoutGeneration(state),
    hiddenTrackCount: getHiddenTrackCount(state),
  }),
  mapDispatchToProps: {
    changeGlobalTrackOrder,
    changeRightClickedTrack,
  },
  component: withSize<Props>(FullTimelineImpl),
});
