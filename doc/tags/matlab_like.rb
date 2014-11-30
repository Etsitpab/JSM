# Tag: @todo
# Parameter: title (on the first line), description (next lines)
# Effect:
#   - display a 'ToDo' section in the documented function.

require "jsduck/tag/boolean_tag"

class Matlab_like < JsDuck::Tag::BooleanTag
  def initialize
    @pattern = "matlike"
    @signature = {:long => "Matlike", :short => "M"}
    @html_position = POS_DOC + 0.1
    @css = <<-EOCSS
      .signature .matlike {
        color: rgb(0, 95, 206);
        background-color: rgb(255, 255, 255);
        border: 1px solid rgb(213, 80, 0);
      }
      .matlike-box {
        border: 1px solid rgb(213, 80, 0);
      }
    EOCSS
    super
  end

end

