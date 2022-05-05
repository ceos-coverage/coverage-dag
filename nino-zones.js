import React from 'react';
import { connect } from 'react-redux';
import {
  openCustomContent,
} from '../modules/modal/actions';
import toggleDistractionFreeModeAction from '../modules/ui/actions';
import AboutPage from '../components/about/about-page';
import IconList from '../components/util/list';
import onClickFeedback from '../modules/feedback/util';

import initFeedback from '../modules/feedback/actions';
import {
  startTour as startTourAction,
  endTour as endTourAction,
} from '../modules/tour/actions';
import util from '../util/util';

const { events } = util;

function NinoZones(props) {
  function getListArray() {
    const arr = [
      {
        text: 'Niño 1+2 (0-10S, 90W-80W)',
        id: 'send_feedback_info_item',
        onClick: () => events.trigger('draw:ninoZone', 'nino1+2'),
      },
      {
        text: 'Niño 3 (5N-5S, 150W-90W)',
        id: 'source_code_info_item',
        onClick: () => events.trigger('draw:ninoZone', 'nino3'),
      },
      {
        text: 'Niño 3.4 (5N-5S, 170W-120W)',
        id: 'whats_new_info_item',
        onClick: () => events.trigger('draw:ninoZone', 'nino3.4'),
      },
      {
        text: 'Niño 4 (5N-5S, 160E-150W)',
        id: 'about_info_item_1',
        onClick: () => events.trigger('draw:ninoZone', 'nino4'),
      },
    ];

    return arr;
  }

  return (<IconList list={getListArray()} size="small" />);
}

function mapStateToProps(state) {
  const {
    feedback, tour, config, models, browser,
  } = state;

  return {
    feedbackIsInitiated: feedback.isInitiated,
    isTourActive: tour.active,
    config,
    models,
    isMobile: browser.lessThan.medium,
  };
}
const mapDispatchToProps = (dispatch) => ({
  toggleDistractionFreeMode: () => {
    dispatch(toggleDistractionFreeModeAction());
  },
  sendFeedback: (isInitiated) => {
    onClickFeedback(isInitiated);
    if (!isInitiated) {
      dispatch(initFeedback());
    }
  },
  startTour: (isTourActive) => {
    if (isTourActive) {
      dispatch(endTourAction());
      setTimeout(() => {
        dispatch(startTourAction());
      }, 100);
    } else {
      dispatch(startTourAction());
    }
  },
  aboutClick: () => {
    // Create new functionality here that renders the about page
    // inside a modal window.
    dispatch(
      openCustomContent('ABOUT_MODAL', {
        headerText: 'About',
        bodyComponent: AboutPage,
        wrapClassName: 'about-page-modal',
      }),
    );
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(NinoZones);
