Ext.data.JsonP.Matching_Descriptor({"tagname":"class","name":"Matching.Descriptor","autodetected":{},"files":[{"filename":"Matching.Descriptor.js","href":"Matching.Descriptor.html#Matching-Descriptor"}],"members":[{"name":"colorspace","tagname":"property","owner":"Matching.Descriptor","id":"property-colorspace","meta":{}},{"name":"descriptorDB","tagname":"property","owner":"Matching.Descriptor","id":"property-descriptorDB","meta":{}},{"name":"distance","tagname":"property","owner":"Matching.Descriptor","id":"property-distance","meta":{}},{"name":"extractModes","tagname":"property","owner":"Matching.Descriptor","id":"property-extractModes","meta":{}},{"name":"nBin","tagname":"property","owner":"Matching.Descriptor","id":"property-nBin","meta":{}},{"name":"normalize","tagname":"property","owner":"Matching.Descriptor","id":"property-normalize","meta":{}},{"name":"relativeOrientation","tagname":"property","owner":"Matching.Descriptor","id":"property-relativeOrientation","meta":{}},{"name":"rings","tagname":"property","owner":"Matching.Descriptor","id":"property-rings","meta":{}},{"name":"sectors","tagname":"property","owner":"Matching.Descriptor","id":"property-sectors","meta":{}},{"name":"type","tagname":"property","owner":"Matching.Descriptor","id":"property-type","meta":{}},{"name":"constructor","tagname":"method","owner":"Matching.Descriptor","id":"method-constructor","meta":{}},{"name":"computeDistances","tagname":"method","owner":"Matching.Descriptor","id":"method-computeDistances","meta":{}},{"name":"extractFromPatch","tagname":"method","owner":"Matching.Descriptor","id":"method-extractFromPatch","meta":{}},{"name":"extractWeightedHistograms","tagname":"method","owner":"Matching.Descriptor","id":"method-extractWeightedHistograms","meta":{}},{"name":"getDataStructure","tagname":"method","owner":"Matching.Descriptor","id":"method-getDataStructure","meta":{}},{"name":"getHistogramNumber","tagname":"method","owner":"Matching.Descriptor","id":"method-getHistogramNumber","meta":{}},{"name":"getPatch","tagname":"method","owner":"Matching.Descriptor","id":"method-getPatch","meta":{}},{"name":"normalizeColor","tagname":"method","owner":"Matching.Descriptor","id":"method-normalizeColor","meta":{}},{"name":"setRingsFromSectors","tagname":"method","owner":"Matching.Descriptor","id":"method-setRingsFromSectors","meta":{"chainable":true}}],"alternateClassNames":[],"aliases":{},"id":"class-Matching.Descriptor","short_doc":"This class create Descriptor object. ...","component":false,"superclasses":[],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/Matching.Descriptor.html#Matching-Descriptor' target='_blank'>Matching.Descriptor.js</a></div></pre><div class='doc-contents'><p>This class create <code>Descriptor</code> object. It contains the\ninformation on how extract a descriptor from a patch.\nThe data extracted will be stored in a <code>DescriptorData</code>\nobject.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-colorspace' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-property-colorspace' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-property-colorspace' class='name expandable'>colorspace</a> : Object<span class=\"signature\"></span></div><div class='description'><div class='short'>Colorspace information for the descriptor ...</div><div class='long'><p>Colorspace information for the descriptor</p>\n<p>Defaults to: <code>{name: &quot;Ohta&quot;, channels: 0}</code></p></div></div></div><div id='property-descriptorDB' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-property-descriptorDB' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-property-descriptorDB' class='name expandable'>descriptorDB</a> : Object<span class=\"signature\"></span></div><div class='description'><div class='short'><p>Examples of descriptors</p>\n</div><div class='long'><p>Examples of descriptors</p>\n</div></div></div><div id='property-distance' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-property-distance' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-property-distance' class='name expandable'>distance</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'>Distance used to compare histograms \"L1\", \"L2\" or \"CEMD\" ...</div><div class='long'><p>Distance used to compare histograms \"L1\", \"L2\" or \"CEMD\"</p>\n<p>Defaults to: <code>&quot;L1&quot;</code></p></div></div></div><div id='property-extractModes' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-property-extractModes' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-property-extractModes' class='name expandable'>extractModes</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>Should modes been extracted from histograms ? ...</div><div class='long'><p>Should modes been extracted from histograms ?</p>\n<p>Defaults to: <code>false</code></p></div></div></div><div id='property-nBin' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-property-nBin' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-property-nBin' class='name expandable'>nBin</a> : Number<span class=\"signature\"></span></div><div class='description'><div class='short'>Number of bin used to build the histograms ...</div><div class='long'><p>Number of bin used to build the histograms</p>\n<p>Defaults to: <code>8</code></p></div></div></div><div id='property-normalize' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-property-normalize' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-property-normalize' class='name expandable'>normalize</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>Should the color of the patch been normalized before\nthe descriptor computation ? ...</div><div class='long'><p>Should the color of the patch been normalized before\nthe descriptor computation ?</p>\n<p>Defaults to: <code>false</code></p></div></div></div><div id='property-relativeOrientation' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-property-relativeOrientation' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-property-relativeOrientation' class='name expandable'>relativeOrientation</a> : Boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>Are histograms rotated with respect to the main orientation ? ...</div><div class='long'><p>Are histograms rotated with respect to the main orientation ?</p>\n<p>Defaults to: <code>true</code></p></div></div></div><div id='property-rings' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-property-rings' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-property-rings' class='name expandable'>rings</a> : Array<span class=\"signature\"></span></div><div class='description'><div class='short'>Radius of each ring ...</div><div class='long'><p>Radius of each ring</p>\n<p>Defaults to: <code>[0.25, 0.75, 1]</code></p></div></div></div><div id='property-sectors' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-property-sectors' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-property-sectors' class='name expandable'>sectors</a> : Array<span class=\"signature\"></span></div><div class='description'><div class='short'>How many rings, and how many sectors per rings ...</div><div class='long'><p>How many rings, and how many sectors per rings</p>\n<p>Defaults to: <code>[1, 4, 4]</code></p></div></div></div><div id='property-type' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-property-type' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-property-type' class='name expandable'>type</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'>The kind of descriptor to extract :\n\"GRADIENT\" or \"WEIGHTED-HISTOGRAMS\" ...</div><div class='long'><p>The kind of descriptor to extract :\n\"GRADIENT\" or \"WEIGHTED-HISTOGRAMS\"</p>\n<p>Defaults to: <code>&quot;GRADIENT&quot;</code></p></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/Matching.Descriptor-method-constructor' class='name expandable'>Matching.Descriptor</a>( <span class='pre'>args</span> ) : <a href=\"#!/api/Matching.Descriptor\" rel=\"Matching.Descriptor\" class=\"docClass\">Matching.Descriptor</a><span class=\"signature\"></span></div><div class='description'><div class='short'>Allows to build Descriptor scheme. ...</div><div class='long'><p>Allows to build <code>Descriptor</code> scheme.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>args</span> : Object<div class='sub-desc'><p>Parameters defining the descriptor. Here are the possible\n fields and there default values:</p>\n\n<ul>\n<li><code>\"sectors\"</code>, <code>Array = [1, 4, 4]</code> : indicate how the the mask is cuted.</li>\n<li><code>\"rings\"</code>, <code>Array = [0.25, 0.75, 1]</code> : indicate the radius of the regions.</li>\n<li><code>\"nBin\"</code>, <code>12</code> : Define the number of bin used for the histogram consruction.</li>\n<li><code>\"relativeOrientation\"</code>, <code>true</code> : declare whether or not the histogram\n are aligned on a main direction.</li>\n<li><code>\"extractModes\"</code>, <code>false</code> : declare whether or not modes should be extracted from\n the histograms.</li>\n<li><code>\"distance\"</code>, <code>\"L1\"</code> : set the distance function used to compare histograms</li>\n<li><code>\"normalize\"</code>, <code>false</code>  : declare whether or not the patch colors have to\nbe normalize before the descriptor computation.</li>\n<li><code>\"type\"</code>, <code>\"GRADIENT\"</code> : type of data can be <code>\"GRADIENT\"</code> for SIFT-like\ndescription and <code>\"WEIGHTED-HISTOGRAMS\"</code> for Hue/Saturation description.</li>\n<li><code>\"colorspace\"</code>, <code>{name: \"Ohta\", channels: 0}</code> define the colorspace channel(s)\nused for descriptor extraction.</li>\n</ul>\n\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Matching.Descriptor\" rel=\"Matching.Descriptor\" class=\"docClass\">Matching.Descriptor</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-computeDistances' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-method-computeDistances' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-method-computeDistances' class='name expandable'>computeDistances</a>( <span class='pre'>request, candidates</span> ) : Array<span class=\"signature\"></span></div><div class='description'><div class='short'>Compute the distances between each sectors of a request DescriptorData\nObject and an Array of DescriptorData candidates. ...</div><div class='long'><p>Compute the distances between each sectors of a <code>request</code> DescriptorData\nObject and an Array of <code>DescriptorData</code> candidates. return an Array\nof distances.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>request</span> : Object<div class='sub-desc'><p><code>DescriptorData</code> object of the request.</p>\n</div></li><li><span class='pre'>candidates</span> : Array<div class='sub-desc'><p>Array of <code>DescriptorData</code> objects of the candidates.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Array</span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-extractFromPatch' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-method-extractFromPatch' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-method-extractFromPatch' class='name expandable'>extractFromPatch</a>( <span class='pre'>o, patchRGB, [mem]</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Extract a DescriptorData structure from a main\norientation o and an RGB image patch patchRGB. ...</div><div class='long'><p>Extract a <code>DescriptorData</code> structure from a main\norientation <code>o</code> and an RGB image patch <code>patchRGB</code>.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>o</span> : Number<div class='sub-desc'>\n</div></li><li><span class='pre'>patchRGB</span> : <a href=\"#!/api/Matrix\" rel=\"Matrix\" class=\"docClass\">Matrix</a><div class='sub-desc'>\n</div></li><li><span class='pre'>mem</span> : Array (optional)<div class='sub-desc'><p>Preallocated memory.</p>\n</div></li></ul></div></div></div><div id='method-extractWeightedHistograms' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-method-extractWeightedHistograms' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-method-extractWeightedHistograms' class='name expandable'>extractWeightedHistograms</a>( <span class='pre'>o, patch, [mem]</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Extract the histograms from a main orientation o and an RGB\nimage patch patch. ...</div><div class='long'><p>Extract the histograms from a main orientation <code>o</code> and an RGB\nimage patch <code>patch</code>.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>o</span> : Number<div class='sub-desc'>\n</div></li><li><span class='pre'>patch</span> : <a href=\"#!/api/Matrix\" rel=\"Matrix\" class=\"docClass\">Matrix</a><div class='sub-desc'>\n</div></li><li><span class='pre'>mem</span> : Array (optional)<div class='sub-desc'><p>Optionnal array used for storage.</p>\n</div></li></ul></div></div></div><div id='method-getDataStructure' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-method-getDataStructure' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-method-getDataStructure' class='name expandable'>getDataStructure</a>( <span class='pre'>[mem]</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Create a DescriptorData structure corresponding to the descriptor. ...</div><div class='long'><p>Create a <code>DescriptorData</code> structure corresponding to the descriptor.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>mem</span> : Array (optional)<div class='sub-desc'><p>Memory preallocated.</p>\n</div></li></ul></div></div></div><div id='method-getHistogramNumber' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-method-getHistogramNumber' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-method-getHistogramNumber' class='name expandable'>getHistogramNumber</a>( <span class='pre'>x, y, o, rMax</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Given a pixel position (x, y), a relative orientation o\nand a radius rMax, this function return the corresponding his...</div><div class='long'><p>Given a pixel position (x, y), a relative orientation <code>o</code>\nand a radius <code>rMax</code>, this function return the corresponding histogram.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>x</span> : Number<div class='sub-desc'>\n</div></li><li><span class='pre'>y</span> : Number<div class='sub-desc'>\n</div></li><li><span class='pre'>o</span> : Number<div class='sub-desc'>\n</div></li><li><span class='pre'>rMax</span> : Number<div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-getPatch' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-method-getPatch' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-method-getPatch' class='name expandable'>getPatch</a>( <span class='pre'>patch</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Compute from an RGB image patch an patch adapted to the descriptor\ncomputation. ...</div><div class='long'><p>Compute from an RGB image patch an patch adapted to the descriptor\ncomputation. This transformation is constituted by a colorspace conversion\nan a gradient phase/norm computation.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>patch</span> : Object<div class='sub-desc'></div></li></ul></div></div></div><div id='method-normalizeColor' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-method-normalizeColor' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-method-normalizeColor' class='name expandable'>normalizeColor</a>( <span class='pre'>patchRGB</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>This function normalize the color of an RGB patch. ...</div><div class='long'><p>This function normalize the color of an RGB patch.\nEach channel is normalize such that they have the same average value.\nThis corresponds to the grey-world and is very useful to have\nrobust color descriptors.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>patchRGB</span> : Object<div class='sub-desc'></div></li></ul></div></div></div><div id='method-setRingsFromSectors' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Matching.Descriptor'>Matching.Descriptor</span><br/><a href='source/Matching.Descriptor.html#Matching-Descriptor-method-setRingsFromSectors' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Matching.Descriptor-method-setRingsFromSectors' class='name expandable'>setRingsFromSectors</a>( <span class='pre'></span> ) : <a href=\"#!/api/Matching.Descriptor\" rel=\"Matching.Descriptor\" class=\"docClass\">Matching.Descriptor</a><span class=\"signature\"><span class='chainable' >chainable</span></span></div><div class='description'><div class='short'>Automatically defines the ring parameters. ...</div><div class='long'><p>Automatically defines the <code>ring</code> parameters.\nBy using this function, the different sectors will all have\nthe same surface.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Matching.Descriptor\" rel=\"Matching.Descriptor\" class=\"docClass\">Matching.Descriptor</a></span><div class='sub-desc'><p>this</p>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{}});