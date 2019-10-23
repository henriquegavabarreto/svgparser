const svgson = require('svgson')
const fs = require('fs')
const pathProps = require('svg-path-properties')
// Expects svg sports to be Figma svg exports - viewbox starts alway with 0 0 imageWidth imageHeight
// reads directory 'hiragana' and get all file names
fs.readdir('hiragana', (err, filenames) => {
  if(err) {
    console.log(err)
    return
  }
  filenames.forEach(filename => {
    // outputs hiragana file name
    console.log(filename)
    // reads the file
    fs.readFile('./hiragana/' + filename, 'utf-8',(err, content) => {
      if(err) {
        console.log(err)
        return
      }
      // parse the svg to an object
      svgson.parse(content).then(obj => {
        console.log(obj)
        obj.children[0].children.forEach(layer => {
          // console.log(layer.attributes.id)
          layer.children.forEach((path, i) => {
            // console.log('__________________________________________')
            // console.log(i)
            let d = path.attributes.d
            // d = d.replace(/([0-9])([A-Z])([0-9])/gi, x => {
            //   return `${x[0]} ${x[1]} ${x[2]}`
            // })
            // d = d.replace(/([A-Z])([0-9])|([0-9])([A-Z])/gi, x => {
            //   return `${x[0]} ${x[1]}`
            // })
            // console.log(path.attributes['stroke-width'])
            // console.log(d)
            var properties = pathProps.svgPathProperties(d)
            var parts = properties.getTotalLength()
            // console.log(parts)
            let lineParts = properties.getParts()
            // console.log(lineParts[0].start, lineParts[lineParts.length - 1].end)
          })
        })
      })
    })
  })
})
