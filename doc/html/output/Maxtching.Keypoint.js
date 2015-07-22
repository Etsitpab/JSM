Ext.data.JsonP.Maxtching_Keypoint({"tagname":"class","name":"Maxtching.Keypoint","autodetected":{},"files":[{"filename":"Matching.Keypoint.js","href":"Matching.Keypoint.html#Maxtching-Keypoint"}],"members":[{"name":"algorithm","tagname":"property","owner":"Maxtching.Keypoint","id":"property-algorithm","meta":{}},{"name":"criterion","tagname":"property","owner":"Maxtching.Keypoint","id":"property-criterion","meta":{}},{"name":"descriptors","tagname":"property","owner":"Maxtching.Keypoint","id":"property-descriptors","meta":{}},{"name":"factorSize","tagname":"property","owner":"Maxtching.Keypoint","id":"property-factorSize","meta":{}},{"name":"nBin","tagname":"property","owner":"Maxtching.Keypoint","id":"property-nBin","meta":{}},{"name":"constructor","tagname":"method","owner":"Maxtching.Keypoint","id":"method-constructor","meta":{}},{"name":"computeDistances","tagname":"method","owner":"Maxtching.Keypoint","id":"method-computeDistances","meta":{}},{"name":"extractDescriptors","tagname":"method","owner":"Maxtching.Keypoint","id":"method-extractDescriptors","meta":{"chainable":true}},{"name":"extractMainOrientation","tagname":"method","owner":"Maxtching.Keypoint","id":"method-extractMainOrientation","meta":{}},{"name":"getCopy","tagname":"method","owner":"Maxtching.Keypoint","id":"method-getCopy","meta":{}},{"name":"match","tagname":"method","owner":"Maxtching.Keypoint","id":"method-match","meta":{}},{"name":"toString","tagname":"method","owner":"Maxtching.Keypoint","id":"method-toString","meta":{}}],"alternateClassNames":[],"aliases":{},"id":"class-Maxtching.Keypoint","component":false,"superclasses":[],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/Matching.Keypoint.html#Maxtching-Keypoint' target='_blank'>Matching.Keypoint.js</a></div></pre><div class='doc-contents'><p>This class creates <code>Keypoint</code> objects which contains the\ninformation on keypoint extracted from an image.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-algorithm' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-property-algorithm' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Maxtching.Keypoint-property-algorithm' class='name expandable'>algorithm</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'>The algorithm used to compute the main(s) orientation(s)\n    of the keypoint. ...</div><div class='long'><p>The algorithm used to compute the main(s) orientation(s)\n    of the keypoint.</p>\n<p>Defaults to: <code>&quot;max&quot;</code></p></div></div></div><div id='property-criterion' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-property-criterion' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Maxtching.Keypoint-property-criterion' class='name expandable'>criterion</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'>The criterion used to compare the Keypoint to others. ...</div><div class='long'><p>The criterion used to compare the Keypoint to others.</p>\n<p>Defaults to: <code>&quot;NN-DR&quot;</code></p></div></div></div><div id='property-descriptors' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-property-descriptors' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Maxtching.Keypoint-property-descriptors' class='name expandable'>descriptors</a> : Object<span class=\"signature\"></span></div><div class='description'><div class='short'><p>The descriptor(s) used to describe the region of the keypoint.</p>\n</div><div class='long'><p>The descriptor(s) used to describe the region of the keypoint.</p>\n</div></div></div><div id='property-factorSize' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-property-factorSize' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Maxtching.Keypoint-property-factorSize' class='name expandable'>factorSize</a> : Number<span class=\"signature\"></span></div><div class='description'><div class='short'>The factor size used to determine the associated region\n    in the image. ...</div><div class='long'><p>The factor size used to determine the associated region\n    in the image.</p>\n<p>Defaults to: <code>18</code></p></div></div></div><div id='property-nBin' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-property-nBin' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Maxtching.Keypoint-property-nBin' class='name expandable'>nBin</a> : Number<span class=\"signature\"></span></div><div class='description'><div class='short'>Number of bins used to compute the histogram of oriented gradient ...</div><div class='long'><p>Number of bins used to compute the histogram of oriented gradient</p>\n<p>Defaults to: <code>36</code></p></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/Maxtching.Keypoint-method-constructor' class='name expandable'>Maxtching.Keypoint</a>( <span class='pre'>x, y, sigma, laplacian</span> ) : <a href=\"#!/api/Maxtching.Keypoint\" rel=\"Maxtching.Keypoint\" class=\"docClass\">Maxtching.Keypoint</a><span class=\"signature\"></span></div><div class='description'><div class='short'>Allows to build Keypoint. ...</div><div class='long'><p>Allows to build <code>Keypoint</code>.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>x</span> : Number<div class='sub-desc'><p>The x location of the keypoint.</p>\n</div></li><li><span class='pre'>y</span> : Number<div class='sub-desc'><p>The y location of the keypoint.</p>\n</div></li><li><span class='pre'>sigma</span> : Number<div class='sub-desc'><p>The blur factor corresponding to the keypoint.</p>\n</div></li><li><span class='pre'>laplacian</span> : Number<div class='sub-desc'><p>The laplacian value of the keypoint.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Maxtching.Keypoint\" rel=\"Maxtching.Keypoint\" class=\"docClass\">Maxtching.Keypoint</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-computeDistances' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-method-computeDistances' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Maxtching.Keypoint-method-computeDistances' class='name expandable'>computeDistances</a>( <span class='pre'>Keypoints, [names]</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Compute distance between the descriptor(s) of a Keypoint and the\ndescriptors of an Array of keypoints. ...</div><div class='long'><p>Compute distance between the descriptor(s) of a Keypoint and the\ndescriptors of an Array of keypoints.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>Keypoints</span> : Array<div class='sub-desc'>\n</div></li><li><span class='pre'>names</span> : Array (optional)<div class='sub-desc'><p>An Array of strings containings the names of the descriptors to\n compare.</p>\n</div></li></ul></div></div></div><div id='method-extractDescriptors' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-method-extractDescriptors' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Maxtching.Keypoint-method-extractDescriptors' class='name expandable'>extractDescriptors</a>( <span class='pre'>patch, [descriptors]</span> ) : <a href=\"#!/api/Maxtching.Keypoint\" rel=\"Maxtching.Keypoint\" class=\"docClass\">Maxtching.Keypoint</a><span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>Extract the Descriptors from a patch. ...</div><div class='long'><p>Extract the Descriptors from a patch.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>patch</span> : Object<div class='sub-desc'>\n</div></li><li><span class='pre'>descriptors</span> : String (optional)<div class='sub-desc'>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Maxtching.Keypoint\" rel=\"Maxtching.Keypoint\" class=\"docClass\">Maxtching.Keypoint</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-extractMainOrientation' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-method-extractMainOrientation' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Maxtching.Keypoint-method-extractMainOrientation' class='name expandable'>extractMainOrientation</a>( <span class='pre'>patch, [algo]</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Extract the main(s) orientation(s) from a patch. ...</div><div class='long'><p>Extract the main(s) orientation(s) from a patch.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>patch</span> : Object<div class='sub-desc'>\n</div></li><li><span class='pre'>algo</span> : String (optional)<div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getCopy' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-method-getCopy' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Maxtching.Keypoint-method-getCopy' class='name expandable'>getCopy</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Return a copy of the keypoint ...</div><div class='long'><p>Return a copy of the keypoint</p>\n</div></div></div><div id='method-match' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-method-match' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Maxtching.Keypoint-method-match' class='name expandable'>match</a>( <span class='pre'>keypoints, criterion, [names]</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Compute the distances between the keypoint and a list of candidates\nthen attribute a disimilarity measure to the matc...</div><div class='long'><p>Compute the distances between the keypoint and a list of candidates\nthen attribute a disimilarity measure to the matches according to\na criterion.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>keypoints</span> : Array<div class='sub-desc'>\n</div></li><li><span class='pre'>criterion</span> : String<div class='sub-desc'><p>Can be either \"NN-DT\", \"NN-DR\", \"NN-AC or \"AC\".</p>\n</div></li><li><span class='pre'>names</span> : Array (optional)<div class='sub-desc'><p>An Array of strings containings the names of the descriptors to\n compare.</p>\n</div></li></ul></div></div></div><div id='method-toString' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Maxtching.Keypoint'>Maxtching.Keypoint</span><br/><a href='source/Matching.Keypoint.html#Maxtching-Keypoint-method-toString' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Maxtching.Keypoint-method-toString' class='name expandable'>toString</a>( <span class='pre'>[x], [y], [scale], [orientation]</span> ) : String<span class=\"signature\"></span></div><div class='description'><div class='short'>Convert the Keypoint to String for export purposes. ...</div><div class='long'><p>Convert the Keypoint to String for export purposes.\nThe fields to export can be specified as parameters.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>x</span> : Boolean (optional)<div class='sub-desc'>\n<p>Defaults to: <code>true</code></p></div></li><li><span class='pre'>y</span> : Boolean (optional)<div class='sub-desc'>\n<p>Defaults to: <code>true</code></p></div></li><li><span class='pre'>scale</span> : Boolean (optional)<div class='sub-desc'>\n<p>Defaults to: <code>true</code></p></div></li><li><span class='pre'>orientation</span> : Boolean (optional)<div class='sub-desc'>\n<p>Defaults to: <code>true</code></p></div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>String</span><div class='sub-desc'>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{}});