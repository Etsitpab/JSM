Ext.data.JsonP.JSM({"tagname":"class","name":"JSM","autodetected":{},"files":[{"filename":"Matrix.extend.histograms.js","href":"Matrix.extend.histograms.html#JSM"}],"singleton":true,"private":true,"members":[{"name":"computeEntropy","tagname":"method","owner":"JSM","id":"method-computeEntropy","meta":{"private":true}},{"name":"extractGaps","tagname":"method","owner":"JSM","id":"method-extractGaps","meta":{"private":true}},{"name":"extractModes","tagname":"method","owner":"JSM","id":"method-extractModes","meta":{"private":true}},{"name":"extractModesAndGaps","tagname":"method","owner":"JSM","id":"method-extractModesAndGaps","meta":{"private":true}},{"name":"getEntropyFct","tagname":"method","owner":"JSM","id":"method-getEntropyFct","meta":{"private":true}},{"name":"getThreshold","tagname":"method","owner":"JSM","id":"method-getThreshold","meta":{"private":true}},{"name":"getUniformPdf","tagname":"method","owner":"JSM","id":"method-getUniformPdf","meta":{"private":true}},{"name":"ifGapOrMode","tagname":"method","owner":"JSM","id":"method-ifGapOrMode","meta":{"private":true}},{"name":"initialize","tagname":"method","owner":"JSM","id":"method-initialize","meta":{"private":true}},{"name":"integrate","tagname":"method","owner":"JSM","id":"method-integrate","meta":{"private":true}},{"name":"max","tagname":"method","owner":"JSM","id":"method-max","meta":{"private":true}},{"name":"maxInf","tagname":"method","owner":"JSM","id":"method-maxInf","meta":{"private":true}},{"name":"maxSup","tagname":"method","owner":"JSM","id":"method-maxSup","meta":{"private":true}},{"name":"min","tagname":"method","owner":"JSM","id":"method-min","meta":{"private":true}},{"name":"norm","tagname":"method","owner":"JSM","id":"method-norm","meta":{"private":true}},{"name":"selectIntervals","tagname":"method","owner":"JSM","id":"method-selectIntervals","meta":{"private":true}},{"name":"vectorToIntervals","tagname":"method","owner":"JSM","id":"method-vectorToIntervals","meta":{"private":true}}],"alternateClassNames":[],"aliases":{},"id":"class-JSM","component":false,"superclasses":[],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/Matrix.extend.histograms.html#JSM' target='_blank'>Matrix.extend.histograms.js</a></div></pre><div class='doc-contents'><div class='rounded-box private-box'><p><strong>NOTE:</strong> This is a private utility class for internal use by the framework. Don't rely on its existence.</p></div>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-computeEntropy' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-computeEntropy' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-computeEntropy' class='name expandable'>computeEntropy</a>( <span class='pre'>r, proba, fct, cst, circular</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Compute the entropy for all the intervals of an histogram. ...</div><div class='long'><p>Compute the entropy for all the intervals of an histogram.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>r</span> : Array<div class='sub-desc'><p>The relative mass of the intervals. That is the mass inside the interval\n divided by the global mass of the histogram.</p>\n</div></li><li><span class='pre'>proba</span> : Array<div class='sub-desc'><p>The probabilities to fall inside the intervals.</p>\n</div></li><li><span class='pre'>fct</span> : Function<div class='sub-desc'><p>The function used to compute the entropies. As parameters, it takes the\n relative mass of the histogram and the probability to fall inside the\n histogram.</p>\n</div></li><li><span class='pre'>cst</span> : Number<div class='sub-desc'><p>The average mass per point.</p>\n</div></li><li><span class='pre'>circular</span> : Boolean<div class='sub-desc'><p>True if the histogram has to be considered as circular.</p>\n</div></li></ul></div></div></div><div id='method-extractGaps' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-extractGaps' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-extractGaps' class='name expandable'>extractGaps</a>( <span class='pre'>input, circular, eps, M, mu, sigma2, groundPdf</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Extract the maximum meaningful gaps of an histogram. ...</div><div class='long'><p>Extract the maximum meaningful gaps of an histogram.\nSee function <a href=\"#!/api/JSM-method-extractModesAndGaps\" rel=\"JSM-method-extractModesAndGaps\" class=\"docClass\">extractModesAndGaps</a> for more details.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>input</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>circular</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>eps</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>M</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>mu</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>sigma2</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>groundPdf</span> : Object<div class='sub-desc'></div></li></ul></div></div></div><div id='method-extractModes' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-extractModes' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-extractModes' class='name expandable'>extractModes</a>( <span class='pre'>input, circular, eps, M, mu, sigma2, groundPdf</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Extract the maximum meaningful modes of an histogram. ...</div><div class='long'><p>Extract the maximum meaningful modes of an histogram.\nSee function <a href=\"#!/api/JSM-method-extractModesAndGaps\" rel=\"JSM-method-extractModesAndGaps\" class=\"docClass\">extractModesAndGaps</a> for more details.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>input</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>circular</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>eps</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>M</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>mu</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>sigma2</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>groundPdf</span> : Object<div class='sub-desc'></div></li></ul></div></div></div><div id='method-extractModesAndGaps' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-extractModesAndGaps' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-extractModesAndGaps' class='name expandable'>extractModesAndGaps</a>( <span class='pre'>hist, [circular], [eps], [M], [mu], [sigma2], [groundPdf]</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Extract the maximum meaningful intervals of an histogram (gaps and\nmodes). ...</div><div class='long'><p>Extract the maximum meaningful intervals of an histogram (gaps and\nmodes). This function handle the case where all points have the same mass\nas well as the cases where they may be approximated by a gaussian\ndistribution (Central limit theorem).</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>hist</span> : Array <div class='sub-desc'><p>The input histogram</p>\n</div></li><li><span class='pre'>circular</span> : Boolean (optional)<div class='sub-desc'><p>True if the histogram is circular.</p>\n<p>Defaults to: <code>false</code></p></div></li><li><span class='pre'>eps</span> : Number (optional)<div class='sub-desc'><p>Correspond to <code>-log10(&lt;Expected number of false alarm&gt;)</code>.</p>\n<p>Defaults to: <code>0</code></p></div></li><li><span class='pre'>M</span> : Integer (optional)<div class='sub-desc'><p>The number of points used to compute the histogram.</p>\n</div></li><li><span class='pre'>mu</span> : Number (optional)<div class='sub-desc'><p>The average mass of the points.</p>\n<p>Defaults to: <code>1</code></p></div></li><li><span class='pre'>sigma2</span> : Number (optional)<div class='sub-desc'><p>The variance of the masses of the points.</p>\n<p>Defaults to: <code>0</code></p></div></li><li><span class='pre'>groundPdf</span> : Array (optional)<div class='sub-desc'><p>The discrete propability distribution of the points.</p>\n</div></li></ul></div></div></div><div id='method-getEntropyFct' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-getEntropyFct' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-getEntropyFct' class='name expandable'>getEntropyFct</a>( <span class='pre'>M, mu, sigma2</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Return the function used to compute the entropy. ...</div><div class='long'><p>Return the function used to compute the entropy.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>M</span> : Integer<div class='sub-desc'><p>The number of point used to compute the histogram.</p>\n</div></li><li><span class='pre'>mu</span> : Number<div class='sub-desc'><p>The average mass of the points.</p>\n</div></li><li><span class='pre'>sigma2</span> : Number<div class='sub-desc'><p>The variance of mass of the points.</p>\n</div></li></ul></div></div></div><div id='method-getThreshold' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-getThreshold' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-getThreshold' class='name expandable'>getThreshold</a>( <span class='pre'>L, M, eps, circular</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Return the threshold to determine is an interval is meaningful or not. ...</div><div class='long'><p>Return the threshold to determine is an interval is meaningful or not.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>L</span> : Integer<div class='sub-desc'><p>The number of bins of the histogram considered.</p>\n</div></li><li><span class='pre'>M</span> : Integer<div class='sub-desc'><p>The number of points used to compute the histogram.</p>\n</div></li><li><span class='pre'>eps</span> : Number<div class='sub-desc'><p>Correspond to <code>-log10(&lt;Expected number of false alarm&gt;)</code>.</p>\n</div></li><li><span class='pre'>circular</span> : Boolean<div class='sub-desc'><p>True if the histogram has to be considered as circular.</p>\n</div></li></ul></div></div></div><div id='method-getUniformPdf' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-getUniformPdf' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-getUniformPdf' class='name expandable'>getUniformPdf</a>( <span class='pre'>t</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Return a discrete uniform distribution. ...</div><div class='long'><p>Return a discrete uniform distribution.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>t</span> : Integer<div class='sub-desc'><p>The number of bins.</p>\n</div></li></ul></div></div></div><div id='method-ifGapOrMode' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-ifGapOrMode' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-ifGapOrMode' class='name expandable'>ifGapOrMode</a>( <span class='pre'>E1, E2, L, thresh, circular</span> ) : Array<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>For each interval, set the entropy to zero if the interval contained a\nmeaningful gap (resp. ...</div><div class='long'><p>For each interval, set the entropy to zero if the interval contained a\nmeaningful gap (resp. mode). Otherwise, return the entropy of the mode\n(resp. gap).</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>E1</span> : Array<div class='sub-desc'><p>Array containing the entropy of all the interval when considered as\n potential modes (resp. gaps).</p>\n</div></li><li><span class='pre'>E2</span> : Array<div class='sub-desc'><p>Array containing the entropy of all the interval when considered as\n potential gap (resp. modes).</p>\n</div></li><li><span class='pre'>L</span> : Integer<div class='sub-desc'><p>The Number of bins of the histogram.</p>\n</div></li><li><span class='pre'>thresh</span> : Number<div class='sub-desc'><p>The threshold used to decide whether or not the interval is meaningful.</p>\n</div></li><li><span class='pre'>circular</span> : Boolean<div class='sub-desc'><p>True if the histogram has to be considered as circular.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Array</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-initialize' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-initialize' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-initialize' class='name expandable'>initialize</a>( <span class='pre'>hist, [circular], [eps], [M], [mu], [sigma2], [groundPdf]</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Control first the arguments and compute the entropy ...</div><div class='long'><p>Control first the arguments and compute the entropy</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>hist</span> : Array <div class='sub-desc'><p>The input histogram</p>\n</div></li><li><span class='pre'>circular</span> : Boolean (optional)<div class='sub-desc'><p>True if the histogram is circular.</p>\n<p>Defaults to: <code>false</code></p></div></li><li><span class='pre'>eps</span> : Number (optional)<div class='sub-desc'><p>Correspond to <code>-log10(&lt;Expected number of false alarm&gt;)</code>.</p>\n<p>Defaults to: <code>0</code></p></div></li><li><span class='pre'>M</span> : Integer (optional)<div class='sub-desc'><p>The number of points used to compute the histogram.</p>\n</div></li><li><span class='pre'>mu</span> : Number (optional)<div class='sub-desc'><p>The average mass of the points.</p>\n</div></li><li><span class='pre'>sigma2</span> : Number (optional)<div class='sub-desc'><p>The variance of the masses of the points.</p>\n</div></li><li><span class='pre'>groundPdf</span> : Array (optional)<div class='sub-desc'><p>The discrete propability distribution of the points.</p>\n</div></li></ul></div></div></div><div id='method-integrate' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-integrate' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-integrate' class='name expandable'>integrate</a>( <span class='pre'>t</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Compute on place the cumulative sum of an array. ...</div><div class='long'><p>Compute on place the cumulative sum of an array.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>t</span> : Array<div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-max' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-max' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-max' class='name expandable'>max</a>( <span class='pre'>v1, v2, v3</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Fast way to compute the maximum of three values. ...</div><div class='long'><p>Fast way to compute the maximum of three values.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>v1</span> : Number<div class='sub-desc'>\n</div></li><li><span class='pre'>v2</span> : Number<div class='sub-desc'>\n</div></li><li><span class='pre'>v3</span> : Number<div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-maxInf' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-maxInf' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-maxInf' class='name expandable'>maxInf</a>( <span class='pre'>H, L, circular</span> ) : Array<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Compute, for each interval I, the maximum entropy of the intervals\ncontained by I. ...</div><div class='long'><p>Compute, for each interval <code>I</code>, the maximum entropy of the intervals\ncontained by <code>I</code>.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>H</span> : Array<div class='sub-desc'><p>Array containing the entropy of all the intervals.</p>\n</div></li><li><span class='pre'>L</span> : Integer<div class='sub-desc'><p>Number of bins in the considered histogram.</p>\n</div></li><li><span class='pre'>circular</span> : Boolean<div class='sub-desc'><p>True if the histogram has to be considered as circular.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Array</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-maxSup' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-maxSup' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-maxSup' class='name expandable'>maxSup</a>( <span class='pre'>H, L, circular</span> ) : Array<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Compute, for an interval I, the maximum entropy of the intervals\ncontaining I. ...</div><div class='long'><p>Compute, for an interval <code>I</code>, the maximum entropy of the intervals\ncontaining <code>I</code>.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>H</span> : Array<div class='sub-desc'><p>Array containing the entropy of all the intervals.</p>\n</div></li><li><span class='pre'>L</span> : Integer<div class='sub-desc'><p>Number of bins in the considered histogram.</p>\n</div></li><li><span class='pre'>circular</span> : Boolean<div class='sub-desc'><p>True if the histogram has to be considered as circular.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Array</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-min' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-min' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-min' class='name expandable'>min</a>( <span class='pre'>v1, v2, v3</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Fast way to compute the minimum of three values. ...</div><div class='long'><p>Fast way to compute the minimum of three values.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>v1</span> : Number<div class='sub-desc'>\n</div></li><li><span class='pre'>v2</span> : Number<div class='sub-desc'>\n</div></li><li><span class='pre'>v3</span> : Number<div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-norm' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-norm' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-norm' class='name expandable'>norm</a>( <span class='pre'>t, cst</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Normalize an array by a given value. ...</div><div class='long'><p>Normalize an array by a given value.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>t</span> : Array<div class='sub-desc'>\n</div></li><li><span class='pre'>cst</span> : Number<div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-selectIntervals' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-selectIntervals' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-selectIntervals' class='name expandable'>selectIntervals</a>( <span class='pre'>hist, circular, Hmod, Hsup, Hinf, thresh</span> ) : Array<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>Select among all the intervals the maximum meaningful ones. ...</div><div class='long'><p>Select among all the intervals the maximum meaningful ones.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>hist</span> : Array<div class='sub-desc'><p>The histogram considered.</p>\n</div></li><li><span class='pre'>circular</span> : Boolean<div class='sub-desc'><p>True if the histogram has to be considered as circular.</p>\n</div></li><li><span class='pre'>Hmod</span> : Array<div class='sub-desc'><p>Array containing the entropy of all the interval when considered as\n modes (resp. gaps). The entropy of the interval containing meaningful\n mode (resp. gap) as to be set to zero.</p>\n</div></li><li><span class='pre'>Hsup</span> : Array<div class='sub-desc'><p>For each interval <code>I</code>, contain the maximum entropy of all the interval\n containing <code>I</code>.</p>\n</div></li><li><span class='pre'>Hinf</span> : Array<div class='sub-desc'><p>For each interval <code>I</code>, contain the maximum entropy of all the interval\n contained by <code>I</code>.</p>\n</div></li><li><span class='pre'>thresh</span> : Number<div class='sub-desc'><p>The threshold used to decide whether or not the interval is meaningful.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Array</span><div class='sub-desc'><p>Array containing the maximum meaningful intervals sorted by\n meaningfulness.</p>\n</div></li></ul></div></div></div><div id='method-vectorToIntervals' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='JSM'>JSM</span><br/><a href='source/Matrix.extend.histograms.html#JSM-method-vectorToIntervals' target='_blank' class='view-source'>view source</a></div><a href='#!/api/JSM-method-vectorToIntervals' class='name expandable'>vectorToIntervals</a>( <span class='pre'>h, circular, cst</span> )<span class=\"signature\"><span class='private' >private</span></span></div><div class='description'><div class='short'>For each interval [i, j] of a cumulate histogram of size N,\ncompute the mass inside. ...</div><div class='long'><p>For each interval <code>[i, j]</code> of a <strong>cumulate</strong> histogram of size <code>N</code>,\ncompute the mass inside. The result is returned as a 2D array <code>m</code>. The\nhistogram can be circular or not. Intervals added by considering the non\ncircular case are interval with <code>i &gt; j</code>. The mass contained by an\ninterval <code>[i, j]</code> correspond, to the cell <code>i * N + j</code>.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>h</span> : Array<div class='sub-desc'><p>The cumulate histogram.</p>\n</div></li><li><span class='pre'>circular</span> : Boolean<div class='sub-desc'><p>True if the histogram has to be considered as circular.</p>\n</div></li><li><span class='pre'>cst</span> : Number<div class='sub-desc'><p>The mass of the histogram.</p>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{"private":true}});