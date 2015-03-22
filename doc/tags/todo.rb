# Tag: @todo
# Parameter: title (on the first line), description (next lines)
# Effect:
#   - display a 'ToDo' section in the documented function.

require "jsduck/tag/boolean_tag"

class ToDo < JsDuck::Tag::BooleanTag
  def initialize
    @pattern = "todo"
    @signature = {:long => "To do", :short => "do"}
    @html_position = POS_DOC + 0.1
    @css = <<-EOCSS
      .signature .todo {
        color: black;
        background-color: #F5D833;
        border: 1px solid #FD6B1B;
      }
      .todo-box {
        border: 1px solid #FD6B1B;
      }
    EOCSS
    super
  end

  def parse_doc(p, pos)
    h = { :tagname => @tagname, :title => p.match(/^.*$/), :doc => :multiline }
    return h;
  end

  def process_doc(h, tags, pos)
    h[@tagname] = { :title => tags[0][:title], :doc => tags[0][:doc] };
  end

  def format(context, formatter)
    context[@tagname][:doc] = formatter.format(context[@tagname][:doc])
  end

  def to_html(context)
    content = context[@tagname]
    if content[:title].empty?
      title = 'There is work to be done!'
    else
      title = 'Work to be done: ' + content[:title]
    end
    <<-EOHTML
      <div class='rounded-box todo-box'>
        <p>#{title}</p>
        #{content[:doc]}
      </div>
    EOHTML
  end
end

