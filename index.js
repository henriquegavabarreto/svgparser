const svgson = require('svgson')
const fs = require('fs')
const pathProps = require('svg-path-properties')
const window = require('svgdom')
const SVG = require('svg.js')(window)
const document = window.document
// create svg.js instance
const canvas = SVG(document.documentElement)

// Expects svg sports to be Figma svg exports - viewbox seems to be always 0 0 imageWidth imageHeight (0 0 as the start)
// TODO: Maybe add a border around the svg viewbox

// gets all svg info from files in a directory and save it
function getAllSVGInfo (dirName) {
  // object that will hold all the relevant data
  let data = {}
  let promiseArray = []
  // reads directory and get all file names
  let filenames = fs.readdirSync(`input/${dirName}`)
  filenames.forEach(filename => {
    // Expects the character to be the file name without extension
    let character = filename.replace('.svg', '')
    // read file and get content
    let fileContent = fs.readFileSync(`./input/${dirName}/${filename}`, 'utf-8')
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
        charInfo.layers[layer.attributes.id] = []
        layer.children.forEach(path => {
          let pathInfo = {}
          // get d and id from all paths
          pathInfo.d = path.attributes.d
          pathInfo.id = path.attributes.id
          // only get start and end points, strokeWidth and total length from interactiveStrokes layer
          if (layer.attributes.id === 'interactiveStrokes') {
            let properties = pathProps.svgPathProperties(pathInfo.d)
            // gets parts from properties
            let lineParts = properties.getParts()
            pathInfo.strokeWidth = path.attributes['stroke-width']
            pathInfo.totalLength = properties.getTotalLength()
            pathInfo.startPoint = lineParts[0].start
            // gets curves to make comparison to drawing
            pathInfo.curve = getCurve(canvas.path(pathInfo.d), 50)
            pathInfo.endPoint = lineParts[lineParts.length - 1].end
          }
          // splice the stroke information to be in the correct stroke order - according to svg id parameters
          charInfo.layers[layer.attributes.id].splice(parseInt(pathInfo.id.replace(/[^0-9]/g,'')) - 1, 0, pathInfo)
        })
      })
      // character will be the file name without extension
      let character = filenames[i].replace('.svg', '')
      data[character] = charInfo
    })
    // save smaller hard-to-read JSON for use and an easy-to-read one
    let readableOutput = JSON.stringify(data, null, 2)
    let output = JSON.stringify(data)
    fs.writeFileSync(`output/${dirName}.json`, output)
    console.log(`Saved ${dirName}.json!`)
    fs.writeFileSync(`output/readable${dirName}.json`, readableOutput)
    console.log(`Saved readable${dirName}.json!`)
  }).catch(err => console.log(err))
}

// function to get curve
function getCurve (svgPath, n = 50) { // parameters are a SVGjs path and number of points to be get that defaults to 50
  let curve = []
  for (let i = 1; i <= n; i++) {
    let point = svgPath.pointAt(svgPath.length() * (i / n))
    curve.push({ x: point.x, y: point.y })
  }
  return curve
}

getAllSVGInfo('hiragana')
