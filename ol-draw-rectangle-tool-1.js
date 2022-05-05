import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { unByKey as OlObservableUnByKey } from 'ol/Observable';
import { Draw as OlInteractionDraw } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import { Vector as OlVectorLayer } from 'ol/layer';
import { Vector as OlVectorSource } from 'ol/source';
import Overlay from 'ol/Overlay';

import Projection from 'ol/proj/Projection';
import Static from 'ol/source/ImageStatic';
import ImageLayer from 'ol/layer/Image';
import {
  Circle as OlStyleCircle,
  Fill as OlStyleFill,
  Stroke as OlStyleStroke,
  Style as OlStyle,
} from 'ol/style';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import util from '../../util/util';

const { events } = util;

let tooltipElement;
let tooltipOverlay;
let init = false;
const allRectangles = {};
const vectorLayers = {};
const sources = {};

/**
 * A component to draw Rectangle functionality to the OL map
 */
function OlDrawRectangleTool(props) {
  let draw;
  let drawChangeListener;
  let rightClickListener;
  let twoFingerTouchListener;

  const {
    map, olMap, crs, unitOfDraw, projections,
  } = props;

  useEffect(() => {
    if (!init) {
      projections.forEach((key) => {
        allRectangles[key] = {};
        vectorLayers[key] = null;
        sources[key] = new OlVectorSource({ wrapX: false });
      });
      init = true;
    }
  }, [projections]);

  useEffect(() => {
    if (map && map.rendered) {
      events.on('draw:rectangle', initDrawRectangle);
      events.on('draw:clear', clearDraw);
    }
    return () => {
      if (map && map.rendered) {
        events.off('draw:rectangle', initDrawRectangle);
        events.off('draw:clear', clearDraw);
      }
    };
  }, [map, unitOfDraw]);

  useEffect(reDrawAllRectangles, [unitOfDraw]);

  const areaBgFill = new OlStyleFill({
    color: 'rgba(213, 78, 33, 0.1)',
  });
  const solidBlackLineStroke = new OlStyleStroke({
    color: 'rgba(0, 0, 0, 1)',
    lineJoin: 'round',
    width: 5,
  });

  const drawStyles = [
    new OlStyle({
      fill: areaBgFill,
      stroke: solidBlackLineStroke,
    }),
    new OlStyle({
      stroke: new OlStyleStroke({
        color: '#fff',
        lineDash: [10, 20],
        lineJoin: 'round',
        width: 2,
      }),
      image: new OlStyleCircle({
        radius: 7,
        stroke: new OlStyleStroke({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
        fill: new OlStyleFill({
          color: 'rgba(255, 255, 255, 0.3)',
        }),
      }),
    }),
  ];

  const vectorStyles = [
    new OlStyle({
      fill: areaBgFill,
      stroke: solidBlackLineStroke,
    }),
    new OlStyle({
      stroke: new OlStyleStroke({
        color: '#fff',
        lineJoin: 'round',
        width: 2,
      }),
    }),
  ];

  const renderTooltip = (feature, overlay) => {
    const removeFeature = () => {
      sources[crs].removeFeature(feature);
      olMap.removeOverlay(overlay);
      delete allRectangles[crs][feature.ol_uid];

      // remove ImageLayer

      const imgLayer = olMap.getLayers().getArray().find((l) => l.get('id') === `imgLayer${feature.attributes.id}`);
      if (imgLayer) {
        olMap.removeLayer(imgLayer);
      }
    };
    const coords = feature.getGeometry().getExtent();
    const months={'JAN':'01','FEB':'02','MAR':'03','APR':'04','MAY':'05','JUN':'06','JUL':'07','AUG':'08','SEP':'09','OCT':'10','NOV':'11','DEC':'12'};
    const current_timestamp = document.getElementById('year-timeline').value+'-'+months[document.getElementById('month-timeline').value]+'-'+document.getElementById('day-timeline').value+'T00:00:00Z';
    ReactDOM.render((
      <div className="tooltip-measure tooltip-custom-black tooltip-static">
        {coords[0].toFixed(3)}<br/>
        {coords[1].toFixed(3)}<br/>
        {coords[2].toFixed(3)}<br/>
        {coords[3].toFixed(3)}<br/>
        <img id="rect_chart" src={"http://ec2-35-156-132-64.eu-central-1.compute.amazonaws.com:8080/get_stats?minx="+coords[0].toFixed(3)+"&miny="+coords[1].toFixed(3)+"&maxx="+coords[2].toFixed(3)+"&maxy="+coords[3].toFixed(3)+"&timestamp="+current_timestamp}  /><img id={'rect_chart_holder'} src="https://cdnjs.cloudflare.com/ajax/libs/galleriffic/2.0.1/css/loader.gif" style={{display: 'none'}}/>
        <span className="close-tooltip" onClick={removeFeature} onTouchEnd={removeFeature}>
          <FontAwesomeIcon icon="times" fixedWidth />
        </span>
      </div>
    ), overlay.getElement());
  };

  const terminateDraw = (geom) => {
    tooltipElement = null;
    olMap.removeInteraction(draw);
    OlObservableUnByKey(drawChangeListener);
    OlObservableUnByKey(rightClickListener);
    OlObservableUnByKey(twoFingerTouchListener);
    events.trigger('map:enable-click-zoom');
  };

  const drawStartCallback = ({ feature }) => {
    let tooltipCoord;
    events.trigger('map:disable-click-zoom');
    drawChangeListener = feature.getGeometry().on('change', (e) => {
      tooltipCoord = feature.getGeometry().getExtent();
      renderTooltip(feature, tooltipOverlay);
      tooltipOverlay.setPosition(tooltipCoord.slice(2, 4));
    });
  };

  const drawEndCallback = ({ feature }) => {
    tooltipOverlay.setOffset([0, -7]);
    allRectangles[crs][feature.ol_uid] = {
      feature,
      overlay: tooltipOverlay,
    };
    terminateDraw();
    renderTooltip(feature, tooltipOverlay);
    feature.attributes = { id: Date.now() };

    //setFeatureImage(feature);  // Sets image inside
  };

  const setFeatureImage = (feature) => {
    const extent = feature.getGeometry().getExtent();
    const projection = new Projection({
      code: 'xkcd-image',
      units: 'pixels',
      extent,
    });
    const imgLayer = new ImageLayer({
      source: new Static({
        attributions: '© <a href="https://xkcd.com/license.html">xkcd</a>',
        url: 'https://imgs.xkcd.com/comics/online_communities.png',
        // url: `http://servername.com?bbox=${extent.join(', ')}`, // Change URL
        projection,
        imageExtent: extent,
      }),
    });

    imgLayer.set('id', `imgLayer${feature.attributes.id}`);

    olMap.addLayer(imgLayer);
  };

  function initDrawRectangle(drawType) {
    const type = drawType === 'rectangle' ? 'Circle' : 'Circle';
    const source = sources[crs];
    if (draw) {
      olMap.removeInteraction(draw);
    }
    draw = new OlInteractionDraw({
      source,
      type,
      style: drawStyles,
      geometryFunction: createBox(),
    });
    olMap.addInteraction(draw);
    if (!vectorLayers[crs]) {
      vectorLayers[crs] = new OlVectorLayer({
        source,
        style: vectorStyles,
        map: olMap,
      });
    }

    tooltipElement = document.createElement('div');
    tooltipOverlay = new Overlay({
      element: tooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
    });
    olMap.addOverlay(tooltipOverlay);

    draw.on('drawstart', drawStartCallback);
    draw.on('drawend', drawEndCallback);
    rightClickListener = olMap.on('contextmenu', (evt) => {
      evt.preventDefault();
      terminateDraw();
      olMap.removeOverlay(tooltipOverlay);
    });
  }

  /**
   * Go through every tooltip and recalculate the measurement based on
   * current settings of unit of measurement
   */
  function reDrawAllRectangles() {
    Object.values(allRectangles).forEach((rectanglesForProj) => {
      Object.values(rectanglesForProj).forEach(
        ({ feature, overlay }) => {
          feature.getGeometry().changed();
          overlay.setOffset([0, -7]);
        },
      );
    });
  }

  /**
   * Clear all existing Draw on the current map projection
   */
  function clearDraw() {
    Object.values(allRectangles[crs]).forEach(
      ({ feature, overlay }) => {
        olMap.removeOverlay(overlay);
        sources[crs].removeFeature(feature);
      },
    );

    allRectangles[crs] = {};
    terminateDraw();
    olMap.removeOverlay(tooltipOverlay);
    if (vectorLayers[crs]) {
      vectorLayers[crs].setMap(null);
      vectorLayers[crs] = null;
    }
  }

  return null;
}

OlDrawRectangleTool.propTypes = {
  map: PropTypes.object,
  olMap: PropTypes.object,
  crs: PropTypes.string,
  toggleDrawActive: PropTypes.func,
};

const mapStateToProps = (state) => {
  const {
    map,
    proj,
    config,
  } = state;
  const { crs } = proj.selected;
  const projections = Object.keys(config.projections).map((key) => config.projections[key].crs);
  return {
    map,
    olMap: map.ui.selected,
    crs,
    projections,
  };
};

export default connect(
  mapStateToProps,
)(OlDrawRectangleTool);
