import axios from "axios";
import { SERVICE_URL } from "../config/constants";

// const Authorization = `fmetoken token=${process.env.FMETOKEN}`;

export async function fetchAddressReport(address, mslink) {
  const url = `${SERVICE_URL}/bylawMapByAddress.fmw`;
  const params = {
    address,
    MSLINK: mslink,
    DestDataset_GENERIC: "ZoningMap",
    opt_showresult: "false",
    opt_servicemode: "sync",
    opt_responseformat: "json",
  };

  const headers = {
    Authorization: `fmetoken token=${process.env.ADDRESSFMETOKEN}`,
  };

  const config = { params, headers };

  try {
    const { data } = await axios.get(url, config);
    return data.serviceResponse.url;
  } catch (error) {
    return error;
  }
}

export async function fetchTileReport(tileNumber) {
  const url = `${SERVICE_URL}/bylawMapByTile.fmw`;
  const params = {
    TILE: tileNumber,
    DestDataset_GENERIC: "ZoningMap",
    opt_showresult: "false",
    opt_servicemode: "sync",
    opt_responseformat: "json",
  };

  const headers = {
    Authorization: `fmetoken token=${process.env.TILEFMETOKEN}`,
  };

  const config = { params, headers };

  try {
    const { data } = await axios.get(url, config);
    return data.serviceResponse.url;
  } catch (error) {
    return new Error(error);
  }
}
