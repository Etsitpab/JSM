# Tag: @fixme
# Parameters: none
# Effect:
#   - display a 'FixMe' flag in the doc.
#   - generate a warning during doc generation.

require "jsduck/tag/boolean_tag"
require "jsduck/logger"

class FixMe < JsDuck::Tag::BooleanTag
  def initialize
    @pattern = "fixme"
    @signature = {:long => "Fix me", :short => "Fix"}
    @css = <<-EOCSS
      .signature .fixme {
        font-weight: bold;
        color: black;
        background-color: #F5D833;
        border: 3px double #AA0000;
      }
      .fixme-box {
        border: 3px double #AA0000;
      }
    EOCSS
    super
  end

  def parse_doc(p, pos)
    JsDuck::Logger.warn(nil, "@fixme found here", pos)
    super
  end

end
