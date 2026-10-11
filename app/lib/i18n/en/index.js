import common from "./common.js";
import account from "./account.js";
import pages from "./pages.js";
import directory from "./directory.js";
import materials from "./materials.js";

/** English translations keyed by the Albanian source string. Each area owns one file. */
const en = { ...common, ...pages, ...directory, ...materials, ...account };

export default en;
