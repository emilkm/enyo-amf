/**
 * The WebKit used in phantomjs 1.9 and earlier does not support XHR2 arraybuffer.
 * So skip the amfx tests until milestone 
 *   - Release 2.0 https://github.com/ariya/phantomjs/issues?milestone=12&page=1&state=open
 *     - Switch to QT5 https://github.com/ariya/phantomjs/issues/10448
 *     - and the Bleeding-edge WebKit https://github.com/ariya/phantomjs/issues/10031
 */
enyo.depends(
	"XhrTest.js"/*,
	"AmfxTest.js",
    "AmfServiceTest.js"*/
);
