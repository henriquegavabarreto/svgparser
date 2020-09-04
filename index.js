const svgson = require('svgson')
const fs = require('fs')
const pathProps = require('svg-path-properties')
const window = require('svgdom')
const SVG = require('svg.js')(window)
const document = window.document
const pathManipulator = require('svgpath')
// create svg.js instance
const canvas = SVG(document.documentElement)
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

// Expects svg sports to be Figma svg exports - viewbox seems to be always 0 0 imageWidth imageHeight (0 0 as the start)
// TODO: Maybe add a border around the svg viewbox

// gets all svg info from files in a directory and save it
// Takes the directory name from input, if it needs to be minified and number of curvePoints to get
function getAllSVGInfo (dirName, outputName, paddingValue = null, minify = false, curvePoints = 50) {
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
      // add padding if passed in the parameters
      if (paddingValue) {
        let vB = svg.attributes.viewBox.split(' ')
        vB[0] = parseInt(vB[0]) - paddingValue
        vB[1] = parseInt(vB[1]) - paddingValue
        vB[2] = parseInt(vB[2]) + (paddingValue * 2)
        vB[3] = parseInt(vB[3]) + (paddingValue * 2)
        charInfo.viewBox = vB.join(' ')
      } else {
        charInfo.viewBox = svg.attributes.viewBox
      }
      svg.children[0].children.forEach(layer => {
        // creates a new node for each layer
        charInfo.layers[layer.attributes.id] = []
        layer.children.forEach(path => {
          let pathInfo = {}
          // round d to two decimals if minify is true
          if (minify) {
            pathInfo.d = pathManipulator(path.attributes.d).round(2).toString()
          } else {
            pathInfo.d = path.attributes.d
          }
          // get id from all paths
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
            pathInfo.curve = getCurve(canvas.path(pathInfo.d), curvePoints)
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
    fs.writeFileSync(`output/${outputName}.json`, output)
    console.log(`Saved ${outputName}.json!`)
    fs.writeFileSync(`output/readable${outputName}.json`, readableOutput)
    console.log(`Saved readable${outputName}.json!`)
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

readline.question(`Directory name with files to parse: `, (dirName) => {
  readline.question(`Name of the output JSON file: `, (outputName) => {
    readline.question(`Padding value (optional - integer): `, (paddingValue) => {
      readline.question(`Minify (y/n): `, (minify) => {
        readline.question(`Number of curve points (optional - defaults to 50) `, (curvePoints) => {
          // check if directory is valid
          if (dirName === '' || !fs.existsSync(`input/${dirName}`)) {
            console.log('This is not a valid directory.')
            process.exit()
          }
          
          if (outputName === '') {
            outputName = 'myDefaultFileName'
          }
          
          // parse paddingValue (defaults to null if padding value is not valid)
          if (paddingValue === '' || isNaN(parseInt(paddingValue))) {
            paddingValue = null
          } else {
            paddingValue = parseInt(paddingValue)
          }
          
          // parse minify to true or false
          if (minify.trim() === 'y') {
            minify = true
          } else {
            minify = false
          }
          
          // parse curvePoints (defaults to 50 if value is not valid)
          if (curvePoints === '' || isNaN(parseInt(curvePoints))) {
            curvePoints = 50
          } else {
            curvePoints = parseInt(curvePoints)
          }
          
          readline.close()
          
          getAllSVGInfo(dirName, outputName, paddingValue, minify, curvePoints)
        })
      })
    })
  })
})

// this should get all the folders on the input and export to their own json files
// getAllSVGInfo('hiraganav2', 5)
