import common from "./common.js";
import account from "./account.js";
import pages from "./pages.js";
import directory from "./directory.js";
import materials from "./materials.js";
import faculties from "./faculties.js";
import legal from "./legal.js";
import moderation from "./moderation.js";

/** English translations keyed by the Albanian source string. Each area owns one file. */
const en = { ...common, ...pages, ...directory, ...materials, ...faculties, ...account, ...moderation, ...legal };

export default en;
