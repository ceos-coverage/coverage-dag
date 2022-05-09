import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import GeoJSON from 'ol/format/GeoJSON';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Vector as OlVectorLayer } from 'ol/layer';
import { Vector as OlVectorSource } from 'ol/source';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Overlay from 'ol/Overlay';
import Projection from 'ol/proj/Projection';
import Static from 'ol/source/ImageStatic';
import ImageLayer from 'ol/layer/Image';
import {
  Fill as OlStyleFill,
  Stroke as OlStyleStroke,
  Style as OlStyle,
} from 'ol/style';
import util from '../../util/util';

const { events } = util;
const geographicProj = 'EPSG:4326';

let tooltipElement;
let tooltipOverlay;
let init = false;
const allNinoZones = {};
const vectorLayers = {};
const sources = {};


const areaBgFill = new OlStyleFill({
  color: 'rgba(213, 78, 33, 0.1)',
});
const solidBlackLineStroke = new OlStyleStroke({
  color: 'rgba(0, 0, 0, 1)',
  lineJoin: 'round',
  width: 5,
});

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

const zones = {
  'nino1+2': {
    name: 'nino1+2',
    image: 'http://ec2-3-65-18-201.eu-central-1.compute.amazonaws.com:8080/get_stats?minx=-90&miny=-10&maxx=-80&maxy=0&timestamp=2016-06-09T00:00:00Z',
    url: 'http://ec2-3-65-18-201.eu-central-1.compute.amazonaws.com:8080/get_stats?minx=-90&miny=-10&maxx=-80&maxy=0&timestamp=2016-06-09T00:00:00Z', // Change URL
    type: 'Feature',
    maxx: 0,
    minx: -10,
    miny: -90,
    maxy: -80,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-90, 0],
          [-80, 0],
          [-80, -10],
          [-90, -10],
          [-90, 0],
        ],
      ],
    },
  },
  nino3: {
    name: 'nino3',
    type: 'Feature',
    image: 'http://ec2-3-65-18-201.eu-central-1.compute.amazonaws.com:8080/get_stats?minx=-150&miny=-5&maxx=-90&maxy=5&timestamp=2016-06-09T00:00:00Z',
    url: 'http://ec2-3-65-18-201.eu-central-1.compute.amazonaws.com:8080/get_stats?minx=-150&miny=-5&maxx=-90&maxy=5&timestamp=2016-06-09T00:00:00Z', // Change URL
    maxx: 5,
    minx: -5,
    miny: -150,
    maxy: -90,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-150, 5],
          [-90, 5],
          [-90, -5],
          [-150, -5],
          [-150, 5],
        ],
      ],
    },
  },
  'nino3.4': {
    name: 'nino3.4',
    type: 'Feature',
    image: 'https://imgs.xkcd.com/comics/online_communities.png',
    url: 'http://ec2-3-65-18-201.eu-central-1.compute.amazonaws.com:8080/get_stats?minx=-170&miny=-5&maxx=-120&maxy=5&timestamp=2016-06-09T00:00:00Z', // Change URL
    maxx: 5,
    minx: -5,
    miny: -170,
    maxy: -120,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-170, 5],
          [-120, 5],
          [-120, -5],
          [-170, -5],
          [-170, 5],
        ],
      ],
    },
  },
  nino4: {
    name: 'nino4',
    type: 'Feature',
    image: 'https://imgs.xkcd.com/comics/online_communities.png',
    url: 'http://ec2-3-65-18-201.eu-central-1.compute.amazonaws.com:8080/get_stats?minx=-180&miny=-5&maxx=-150&maxy=5&timestamp=2016-06-09T00:00:00Z', // Change URL
    maxx: 5,
    minx: -5,
    miny: 160,
    maxy: -150,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-200, 5],
          [-150, 5],
          [-150, -5],
          [-200, -5],
          [-200, 5],

        ],
      ],
    },
  },
};

const geojsonObject = {
  type: 'FeatureCollection',
  crs: {
    type: 'name',
    properties: {
      name: geographicProj,
    },
  },
  features: [],
};

/**
 * A component to draw NinoZone functionality to the OL map
 */
function OlNinoZoneTool(props) {
  const {
    map, olMap, crs, projections,
  } = props;

  useEffect(() => {
    if (!init) {
      projections.forEach((key) => {
        allNinoZones[key] = {};
        vectorLayers[key] = null;
        sources[key] = new OlVectorSource({ wrapX: false });
      });
      init = true;
    }
  }, [projections]);

  useEffect(() => {
    if (map && map.rendered) {
      events.on('draw:ninoZone', initMarkNinoZones);
      events.on('draw:clear', clearDraw);
    }
    return () => {
      if (map && map.rendered) {
        events.off('draw:ninoZone', initMarkNinoZones);
        events.off('draw:clear', clearDraw);
      }
    };
  }, [map]);

  function initMarkNinoZones(zone) {
    if (!vectorLayers[crs]) {
      vectorLayers[crs] = new OlVectorLayer({
        source: sources[crs],
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

    const fIndex = geojsonObject.features.findIndex((f) => f.name === zone);
    if (fIndex < 0) {
      geojsonObject.features.push(zones[zone]);
      const features = new GeoJSON().readFeatures(geojsonObject);

      // Add tooltip
      const feature = features.filter((f) => {
        const coordsArr = f.getGeometry().getCoordinates();
        return JSON.stringify(zones[zone].geometry.coordinates) === JSON.stringify(coordsArr);
      });
      if (feature && feature[0]) {
        //setFeatureImage(feature[0], zones[zone], olMap);  // This sets an image inside the box
        sources[crs].addFeature(feature[0]);
        const tooltipCoord = feature[0].getGeometry().getExtent();
        renderTooltip(feature[0], tooltipOverlay, zones[zone]);
        tooltipOverlay.setPosition(tooltipCoord.slice(2, 4));
      }
    }
  }

  const setFeatureImage = (feature, zone) => {
    const projection = new Projection({
      code: 'xkcd-image',
      units: 'pixels',
      extent: feature.getGeometry().getExtent(),
    });
    const imgLayer = new ImageLayer({
      source: new Static({
        attributions: '© <a href="https://xkcd.com/license.html">xkcd</a>',
        url: zone.image,
        projection,
        imageExtent: feature.getGeometry().getExtent(),
      }),
    });

    imgLayer.set('name', `imgLayer${zone.name}`);

    olMap.addLayer(imgLayer);
  };

  const renderTooltip = (feature, overlay, zone) => {
    const removeFeature = () => {
      geojsonObject.features.splice(geojsonObject.features.findIndex((f) => f.name === zone.name), 1);
      sources[crs].removeFeature(feature);
      olMap.removeOverlay(overlay);

      // remove ImageLayer
      const imgLayer = olMap.getLayers().getArray().find((l) => l.get('name') === `imgLayer${zone.name}`);
      if (imgLayer) {
        olMap.removeLayer(imgLayer);
      }
    };
    ReactDOM.render((
      <div className="tooltip-measure tooltip-custom-black tooltip-static">
        {zone.name}<img id={zone.name} src={zone.url} />
        <span className="close-tooltip" onClick={removeFeature} onTouchEnd={removeFeature}>
          <FontAwesomeIcon icon="times" fixedWidth />
        </span>
      </div>
    ), overlay.getElement());
  };
  // {zone.url}<div id={zone.name}> </div> "http://ec2-3-65-18-201.eu-central-1.compute.amazonaws.com:8080/get_stats?minx={zone.minx}&miny={miny}&maxx={zone.maxx}&maxy={zone.maxy}&timestamp=2016-06-09T00:00:00Z"
  /**
   * Clear all existing Draw on the current map projection
   */
  function clearDraw() {
    Object.values(allNinoZones[crs]).forEach(
      ({ feature, overlay }) => {
        olMap.removeOverlay(overlay);
        sources[crs].removeFeature(feature);
      },
    );

    allNinoZones[crs] = {};

    olMap.removeOverlay(tooltipOverlay);
    if (vectorLayers[crs]) {
      vectorLayers[crs].setMap(null);
      vectorLayers[crs] = null;
    }
  }

  return null;
}

OlNinoZoneTool.propTypes = {
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
)(OlNinoZoneTool);
