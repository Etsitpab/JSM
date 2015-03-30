Ext.data.JsonP.Matching_Scalespace({"tagname":"class","name":"Matching.Scalespace","autodetected":{},"files":[{"filename":"Matching.Scalespace.js","href":"Matching.Scalespace.html#Matching-Scalespace"}],"members":[{"name":"constructor","tagname":"method","owner":"Matching.Scalespace","id":"method-constructor","meta":{}},{"name":"computeScaleSpace","tagname":"method","owner":"Matching.Scalespace","id":"method-computeScaleSpace","meta":{"chainable":true}},{"name":"descriptorsToString","tagname":"method","owner":"Matching.Scalespace","id":"method-descriptorsToString","meta":{}},{"name":"extractDescriptors","tagname":"method","owner":"Matching.Scalespace","id":"method-extractDescriptors","meta":{"chainable":true}},{"name":"extractMainOrientations","tagname":"method","owner":"Matching.Scalespace","id":"method-extractMainOrientations","meta":{"chainable":true}},{"name":"getImage","tagname":"method","owner":"Matching.Scalespace","id":"method-getImage","meta":{}},{"name":"getImagePatch","tagname":"method","owner":"Matching.Scalespace","id":"method-getImagePatch","meta":{}},{"name":"harrisThreshold","tagname":"method","owner":"Matching.Scalespace","id":"method-harrisThreshold","meta":{"chainable":true}},{"name":"keypointsToString","tagname":"method","owner":"Matching.Scalespace","id":"method-keypointsToString","meta":{}},{"name":"laplacianThreshold","tagname":"method","owner":"Matching.Scalespace","id":"method-laplacianThreshold","meta":{"chainable":true}},{"name":"normalizePatch","tagname":"method","owner":"Matching.Scalespace","id":"method-normalizePatch","meta":{}},{"name":"precomputeHarris","tagname":"method","owner":"Matching.Scalespace","id":"method-precomputeHarris","meta":{"chainable":true}},{"name":"precomputeMaxLaplacian","tagname":"method","owner":"Matching.Scalespace","id":"method-precomputeMaxLaplacian","meta":{"chainable":true}}],"alternateClassNames":[],"aliases":{},"id":"class-Matching.Scalespace","component":false,"superclasses":[],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/Matching.Scalespace.html#Matching-Scalespace' target='_blank'>Matching.Scalespace.js</a></div></pre><div class='doc-contents'>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/Matching.Scalespace-method-constructor' class='name expandable'>Matching.Scalespace</a>( <span class='pre'></span> ) : <a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a><span class=\"signature\"></span></div><div class='description'><div class='short'> ...</div><div class='long'>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-computeScaleSpace' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-computeScaleSpace' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-computeScaleSpace' class='name expandable'>computeScaleSpace</a>( <span class='pre'>nScale, sigmaInit, scaleRation</span> ) : Object<span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>This function computes the scalespace. ...</div><div class='long'><p>This function computes the scalespace.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>nScale</span> : Number<div class='sub-desc'><p>The Number of scale used.</p>\n</div></li><li><span class='pre'>sigmaInit</span> : Number<div class='sub-desc'><p>The blur factor of the first scale.</p>\n</div></li><li><span class='pre'>scaleRation</span> : Number<div class='sub-desc'><p>The factor to appy to go to the next scale.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object</span><div class='sub-desc'><p>An image.</p>\n</div></li></ul></div></div></div><div id='method-descriptorsToString' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-descriptorsToString' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-descriptorsToString' class='name expandable'>descriptorsToString</a>( <span class='pre'>name</span> ) : String<span class=\"signature\"></span></div><div class='description'><div class='short'>Function to use for exporting the list of descriptors ...</div><div class='long'><p>Function to use for exporting the list of descriptors</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>name</span> : Object<div class='sub-desc'></div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>String</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-extractDescriptors' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-extractDescriptors' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-extractDescriptors' class='name expandable'>extractDescriptors</a>( <span class='pre'>[Descriptor]</span> ) : <a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a><span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>Extract the descriptor(s) of all keypoint detected in\nthe scalespace. ...</div><div class='long'><p>Extract the descriptor(s) of all keypoint detected in\nthe scalespace.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>Descriptor</span> : Array (optional)<div class='sub-desc'><p>An Array of descriptors to extract</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-extractMainOrientations' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-extractMainOrientations' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-extractMainOrientations' class='name expandable'>extractMainOrientations</a>( <span class='pre'>algorithm</span> ) : <a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a><span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>Extract the main direction(s) of all keypoint detected in\nthe scalespace. ...</div><div class='long'><p>Extract the main direction(s) of all keypoint detected in\nthe scalespace.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>algorithm</span> : String<div class='sub-desc'><p>Algorithm to use.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-getImage' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-getImage' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-getImage' class='name expandable'>getImage</a>( <span class='pre'>scale, img, norm</span> ) : String<span class=\"signature\"></span></div><div class='description'><div class='short'>Function to use to get an image of the scalespace at a given\nscale and with gradient computed. ...</div><div class='long'><p>Function to use to get an image of the scalespace at a given\nscale and with gradient computed. It is useful for display\npurpose.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>scale</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>img</span> : Object<div class='sub-desc'></div></li><li><span class='pre'>norm</span> : Object<div class='sub-desc'></div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>String</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getImagePatch' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-getImagePatch' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-getImagePatch' class='name expandable'>getImagePatch</a>( <span class='pre'>keypoint, rgb</span> ) : Object<span class=\"signature\"></span></div><div class='description'><div class='short'>Returns the patch corresponding to a keypoint. ...</div><div class='long'><p>Returns the patch corresponding to a keypoint.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>keypoint</span> : Object<div class='sub-desc'><p>The keypoint.</p>\n</div></li><li><span class='pre'>rgb</span> : Boolean<div class='sub-desc'><p>True if rgb patch is required false for gray-scale only.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object</span><div class='sub-desc'><p>The patch</p>\n</div></li></ul></div></div></div><div id='method-harrisThreshold' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-harrisThreshold' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-harrisThreshold' class='name expandable'>harrisThreshold</a>( <span class='pre'>threshold</span> ) : <a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a><span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>Apply a threshold on the Harris pyramid. ...</div><div class='long'><p>Apply a threshold on the Harris pyramid.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>threshold</span> : Number<div class='sub-desc'>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-keypointsToString' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-keypointsToString' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-keypointsToString' class='name expandable'>keypointsToString</a>( <span class='pre'></span> ) : String<span class=\"signature\"></span></div><div class='description'><div class='short'>Function to use for exporting the keypoint list ...</div><div class='long'><p>Function to use for exporting the keypoint list</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>String</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-laplacianThreshold' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-laplacianThreshold' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-laplacianThreshold' class='name expandable'>laplacianThreshold</a>( <span class='pre'>threshold</span> ) : <a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a><span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>Apply a threshold on the laplacian pyramid. ...</div><div class='long'><p>Apply a threshold on the laplacian pyramid.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>threshold</span> : Number<div class='sub-desc'>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-normalizePatch' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-normalizePatch' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-normalizePatch' class='name expandable'>normalizePatch</a>( <span class='pre'>patchRGB</span> ) : Object<span class=\"signature\"></span></div><div class='description'><div class='short'>Normalize the colors of an image patch, by using the\nGrey-World hypothesis. ...</div><div class='long'><p>Normalize the colors of an image patch, by using the\nGrey-World hypothesis.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>patchRGB</span> : Object<div class='sub-desc'>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Object</span><div class='sub-desc'><p>Oject with the following properties:</p>\n\n<ul>\n<li>patch: The patch normalised (not a copy),</li>\n<li>mean: An array containing the R, G and B average values,\nbefore normalisation,</li>\n<li>mask: the spatial mask used to compute the normalisation.</li>\n</ul>\n\n</div></li></ul></div></div></div><div id='method-precomputeHarris' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-precomputeHarris' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-precomputeHarris' class='name expandable'>precomputeHarris</a>( <span class='pre'></span> ) : <a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a><span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>Function used to precompute the Harris pyramid. ...</div><div class='long'><p>Function used to precompute the Harris pyramid.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div><div id='method-precomputeMaxLaplacian' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Scalespace'>Matching.Scalespace</span><br/><a href='source/Matching.Scalespace.html#Matching-Scalespace-method-precomputeMaxLaplacian' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Scalespace-method-precomputeMaxLaplacian' class='name expandable'>precomputeMaxLaplacian</a>( <span class='pre'></span> ) : <a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a><span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>Function used to precompute the laplacian pyramid. ...</div><div class='long'><p>Function used to precompute the laplacian pyramid.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Matching.Scalespace\" rel=\"Matching.Scalespace\" class=\"docClass\">Matching.Scalespace</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{}});