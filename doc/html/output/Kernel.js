Ext.data.JsonP.Kernel({"tagname":"class","name":"Kernel","autodetected":{},"files":[{"filename":"Image.class.js","href":"Image.class.html#Kernel"}],"private":true,"members":[{"name":"gaussian","tagname":"method","owner":"Kernel","id":"method-gaussian","meta":{}},{"name":"normalize","tagname":"method","owner":"Kernel","id":"method-normalize","meta":{}}],"alternateClassNames":[],"aliases":{},"id":"class-Kernel","component":false,"superclasses":[],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/Image.class.html#Kernel' target='_blank'>Image.class.js</a></div></pre><div class='doc-contents'><div class='rounded-box private-box'><p><strong>NOTE:</strong> This is a private utility class for internal use by the framework. Don't rely on its existence.</p></div><p>Holds kernels generation for filtering.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-gaussian' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Kernel'>Kernel</span><br/><a href='source/Image.class.html#Kernel-method-gaussian' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Kernel-method-gaussian' class='name expandable'>gaussian</a>( <span class='pre'>sigma, [order], [precision]</span> ) : Float32Array<span class=\"signature\"></span></div><div class='description'><div class='short'>Compute a gaussian kernel and its derivatives. ...</div><div class='long'><p>Compute a gaussian kernel and its derivatives.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>sigma</span> : Number<div class='sub-desc'><p>Standard deviation of kernel</p>\n</div></li><li><span class='pre'>order</span> : Integer (optional)<div class='sub-desc'><p>Derivative order: 0, 1 or 2</p>\n<p>Defaults to: <code>0</code></p></div></li><li><span class='pre'>precision</span> : Number (optional)<div class='sub-desc'><p>Precision of the kernel</p>\n<p>Defaults to: <code>3.0</code></p></div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Float32Array</span><div class='sub-desc'><p>The gaussian Kernel</p>\n</div></li></ul></div></div></div><div id='method-normalize' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='Kernel'>Kernel</span><br/><a href='source/Image.class.html#Kernel-method-normalize' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Kernel-method-normalize' class='name expandable'>normalize</a>( <span class='pre'>kernel</span> ) : Array<span class=\"signature\"></span></div><div class='description'><div class='short'>Normalize a kernel. ...</div><div class='long'><p>Normalize a kernel.\nNormalization such that its L1 norm is 1.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>kernel</span> : Array<div class='sub-desc'><p>The kernel.</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'>Array</span><div class='sub-desc'><p>The same array, but normalized.</p>\n</div></li></ul></div></div></div></div></div></div></div>","meta":{"private":true}});