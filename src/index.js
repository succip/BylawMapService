import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Basemap from "@arcgis/core/Basemap";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import TileLayer from "@arcgis/core/layers/TileLayer";
import Search from "@arcgis/core/widgets/Search";
import Query from "@arcgis/core/rest/support/Query.js";
import { startPoint, tileResultSymbol } from "./config/Constants";
import "./styles/normalize.css";
import "./styles/style.css";

const basemap = new Basemap({
  baseLayers: [
    new TileLayer({
      url: "https://gisservices.surrey.ca/arcgis/rest/services/Base_Map_All_Scales/MapServer",
    }),
    new TileLayer({
      url: "https://gisservices.surrey.ca/arcgis/rest/services/Addresses_Mobile_Black_Anno_Cache/MapServer",
    }),
  ],
});

const map = new Map({
  basemap,
});

const view = new MapView({
  map,
  container: "viewDiv",
  zoom: 7,
  center: startPoint,
});

const lyrLots = new FeatureLayer({
  url: "https://gisservices.surrey.ca/arcgis/rest/services/Lots/MapServer",
  layerId: 7,
  outFields: ["MSLINK"],
  renderer: {
    type: "simple",
    symbol: {
      type: "simple-fill",
      color: [0, 0, 0, 0.1],
      outline: {
        width: 0.5,
        color: "black",
      },
    },
  },
});

const lyrMapIndex = new FeatureLayer({
  url: "https://gisservices.surrey.ca/arcgis/rest/services/Public/Miscellaneous/MapServer/12",
  outFields: ["MAP_NO"],
  title: "Map Tiles",
  labelingInfo: [
    {
      symbol: {
        type: "text",
        color: "black",
        font: { weight: "bold" },
        haloColor: "white",
        haloSize: "1px",
      },
      labelExpressionInfo: { expression: "$feature.MAP_NO" },
    },
  ],
});

const searchWidget = new Search({
  view,
  includeDefaultSources: false,
  locationEnabled: false,
  popupEnabled: false,
  allPlaceholder: "Find address or tile",
  sources: [
    {
      url: "https://gisservices.surrey.ca/arcgis/rest/services/AddressSuggest/GeocodeServer",
      name: "Surrey Addresses",
      resultSymbol: {
        type: "simple-marker",
        color: "red",
        outline: {
          color: [255, 255, 255],
          width: 1,
        },
      },
    },
    {
      layer: lyrMapIndex,
      resultSymbol: tileResultSymbol,
      name: "Surrey Map Tiles",
    },
  ],
});

view.ui.add(searchWidget, {
  position: "top-left",
  index: 0,
});

map.add(lyrLots, lyrMapIndex);

view.when(() => {
  searchWidget.on("search-complete", async (event) => {
    const searchSourceIndex = event.results[0].results[0].sourceIndex;
    if (searchSourceIndex === 0) {
      const address = event.results[0].results[0].name.toUpperCase();
      const mslink = await getMslink(event.results[0].results[0].feature);
    }
  });
});

function getMslink({ geometry }) {
  let point = {
    type: "point",
    x: geometry.x,
    y: geometry.y,
    spatialReference: { wkid: 26910 },
  };

  let query = new Query({
    geometry: point,
    outFields: ["MSLINK"],
  });

  return lyrLots.queryFeatures(query).then(({ features }) => features[0].attributes.MSLINK);
}
