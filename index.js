const svgson = require('svgson')
const fs = require('fs')
const pathProps = require('svg-path-properties')
// Expects svg sports to be Figma svg exports - viewbox seems to be always 0 0 imageWidth imageHeight (0 0 as the start)
// TODO: Maybe add a border around the svg viewbox

// gets all svg info from files in a directory and save it
function getAllSVGInfo (dirName) {
  // object that will hold all the relevant data
  let data = {}
  let promiseArray = []
  // reads directory and get all file names
  let filenames = fs.readdirSync(dirName)
  filenames.forEach(filename => {
    // Expects the character to be the file name without extension
    let character = filename.replace('.svg', '')
    // read file and get content
    let fileContent = fs.readFileSync(`./${dirName}/${filename}`, 'utf-8')
    // push svgson parsing to the promise array
    promiseArray.push(svgson.parse(fileContent))
  })
  Promise.all(promiseArray).then(svgs => {
    // include index in for each to associate with respective character
    svgs.forEach((svg, i) => {
      let charInfo = {}
      charInfo.layers = {}
      charInfo.viewBox = svg.attributes.viewBox
      svg.children[0].children.forEach(layer => {
        // creates a new node for each layer
        charInfo.layers[layer.attributes.id] = {}
        layer.children.forEach(path => {
          let pathInfo = {}
          pathInfo.d = path.attributes.d
          pathInfo.strokeWidth = path.attributes['stroke-width']
          let properties = pathProps.svgPathProperties(pathInfo.d)
          // gets parts from properties
          let lineParts = properties.getParts()
          pathInfo.totalLength = properties.getTotalLength()
          // only get start and end points from interactiveStrokes layer
          if (layer.attributes.id === 'interactiveStrokes') {
            pathInfo.startPoint = lineParts[0].start
            pathInfo.endPoint = lineParts[lineParts.length - 1].end
          }
          charInfo.layers[layer.attributes.id][path.attributes.id] = pathInfo
        })
      })
      let character = filenames[i].replace('.svg', '')
      data[character] = charInfo
    })
    let output = JSON.stringify(data, null, 2)
    fs.writeFileSync(`${dirName}.json`, output)
    console.log('File Saved!')
  }).catch(err => console.log(err))
}

getAllSVGInfo('hiragana')
