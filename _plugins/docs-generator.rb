module DocsGenerator
  class Generator < Jekyll::Generator
    def generate(site)
      docSections = {};
      fileEntries = Dir.glob("docs/**/**/index.html")
      fileEntries.each { |fileEntry|
        fileEntryParts = fileEntry.split(File::SEPARATOR)
        if docSections[fileEntryParts[1]].nil?
          docSections[fileEntryParts[1]] = {
            'name' => fileEntryParts[1],
            'pages' => []
          }
        end
        docSections[fileEntryParts[1]]['pages'] << fileEntry
      }

      # Sort release array
      if !(docSections['releases'].nil?)
        docSections['releases']['pages'] = docSections['releases']['pages'].sort! { |a, b|
          Gem::Version.new(a.split(File::SEPARATOR)[2].sub('v', '')) <=> Gem::Version.new(b.split(File::SEPARATOR)[2].sub('v', ''))
        }.reverse
      end

      site.data['docs'] = docSections
    end
  end
end
