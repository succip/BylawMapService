import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Basemap from "@arcgis/core/Basemap";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import TileLayer from "@arcgis/core/layers/TileLayer";
import Search from "@arcgis/core/widgets/Search";
import Query from "@arcgis/core/rest/support/Query.js";
import $ from "jquery";
import { START_POINT, ADDRESS_RESULT_SYMBOL, TILE_RESULT_SYMBOL } from "./config/constants";
import { fetchAddressReport, fetchTileReport } from "./utils/fetchData";

import "./styles/normalize.css";
import "./styles/style.css";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/calcite/calcite.css";
import { setAssetPath } from "@esri/calcite-components/dist/components";
setAssetPath(location.href);

let address, mslink, tileNumber, reportType;

const txtInfo = $("#infoText");
const spanDownloadLink = $("#downloadLink");
const loader = $("#loader");
const btnGenerate = $("#btnGenerate");

btnGenerate.on("click", async () => {
  disableBtnGenerate();
  try {
    loader.show();
    if (reportType === "address") {
      const downloadUrl = await fetchAddressReport(address, mslink);
      spanDownloadLink.html(
        `Your map is ready! <a href=${downloadUrl}>Click here to download it.</a>`
      );
      enableBtnGenerate();
    } else {
      const downloadUrl = await fetchTileReport(tileNumber);
      spanDownloadLink.html(
        `Your map is ready! <a href=${downloadUrl}>Click here to download it.</a>`
      );
    }
  } catch {
    spanDownloadLink.html("Error occurred! Contact Paolo.Succi@Surrey.ca");
  } finally {
    enableBtnGenerate();
    loader.hide();
  }
});

const disableBtnGenerate = () => btnGenerate.attr("disabled", "disabled");
const enableBtnGenerate = () => btnGenerate.removeAttr("disabled");

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
  center: START_POINT,
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
      resultSymbol: ADDRESS_RESULT_SYMBOL,
    },
    {
      layer: lyrMapIndex,
      resultSymbol: TILE_RESULT_SYMBOL,
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
    reportType = event.results[0].results[0].sourceIndex === 0 ? "address" : "tile";
    if (reportType === "address") {
      address = event.results[0].results[0].name.toUpperCase();
      mslink = await getMslink(event.results[0].results[0].feature);
      txtInfo.text(address);
    } else if (reportType === "tile") {
      tileNumber = event.results[0].results[0].name;
      txtInfo.text(`Tile number: ${tileNumber}`);
    }
    spanDownloadLink.html("");
    enableBtnGenerate();
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
