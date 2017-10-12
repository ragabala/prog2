/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
//const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
//const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/ellipsoids.json"; // ellipsoids file loc

const INPUT_ELLIPSOIDS_URL = "https://demo8647310.mockable.io/"
const INPUT_TRIANGLES_URL  ="https://demo2448912.mockable.io"
// default eye position in world space

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!

var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples

var colorBuffer_a;
var colorBuffer_d;
var colorBuffer_s;
var normalBuffer;


 // color buffer contains r g b a for each fragments
var triBufferSize = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader

var vertexColorAttrib_a;
var vertexColorAttrib_d;
var vertexColorAttrib_s;

var vertexNormalAttrib;

// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get json file



// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL







function loadShapes(desc = ""){
        var inputEllipsoids = getJSONFile(INPUT_ELLIPSOIDS_URL,"ellipsoids");
        var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");

       // console.log(JSON.stringify(inputEllipsoids))
      if (inputEllipsoids != String.null && inputTriangles != String.null) { 


        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
      
        var coordArray = []; // 1D array of vertex coords for WebGL
        var indexArray = []; // 1D array of vertex indices for WebGL
        var normalArray = [];
       
        var colorArray_a = [];
        var colorArray_d = [];
        var colorArray_s = [];


        var vtxBufferSize = 0; // the number of vertices in the vertex buffer

        var vtxToAdd = []; // vtx coords to add to the coord array
        var normalToAdd = [];

        var indexOffset = vec3.create(); // the index offset for the current set
        var triToAdd = vec3.create(); // tri indices to add to the index array


        /*******************************************************************/

        // Ellipsoids
        if(desc != "triangles" ) 
        for (var epllipsoidIndex=0; epllipsoidIndex<inputEllipsoids.length; epllipsoidIndex++) {

            vec3.set(indexOffset,vtxBufferSize,vtxBufferSize,vtxBufferSize); // update vertex offset
            
            var currentEllipsoid = inputEllipsoids[epllipsoidIndex];

                 //setting up Ellipsoid Vertices
                 currentEllipsoid.vertices = [];
                 currentEllipsoid.triangles = [];
                 currentEllipsoid.normals = [];

                // predefined
                var latitudeBands = 50;
                var longitudeBands = 50;
               
            for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
                var theta = latNumber * Math.PI / latitudeBands;
                var sinTheta = Math.sin(theta);
                var cosTheta = Math.cos(theta);

                for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                    var vertex = [];
                    var normal = [];

                    var phi = longNumber * 2 * Math.PI / longitudeBands;
                    var sinPhi = Math.sin(phi);
                    var cosPhi = Math.cos(phi);

                    var x = (cosPhi * sinTheta) ;
                    var y = (cosTheta) ;
                    var z = sinPhi * sinTheta;
                    var u = 1 - (longNumber / longitudeBands);
                    var v = 1 - (latNumber / latitudeBands);

                    normal.push(x);
                    normal.push(y);
                    normal.push(z);

                    vertex.push((currentEllipsoid.a * x) + currentEllipsoid.x);
                    vertex.push((currentEllipsoid.b * y)  + currentEllipsoid.y);
                    vertex.push((currentEllipsoid.c * z)  + currentEllipsoid.z);
                    currentEllipsoid.vertices.push(vertex);
                    currentEllipsoid.normals.push(normal);

                }
            } // end of latitude for loop

            //console.log(currentEllipsoid.vertices)

            // indices or triangles

                for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
                    for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                        var index = [];
                        var first = (latNumber * (longitudeBands + 1)) + longNumber;
                        var second = first + longitudeBands + 1;
                        index.push(first);
                        index.push(second);
                        index.push(first + 1);
                        currentEllipsoid.triangles.push(index);

                        index = [];
                        index.push(second);
                        index.push(second + 1);
                        index.push(first + 1);
                        currentEllipsoid.triangles.push(index);
                    }
                }


            for (var normalIndex = 0; normalIndex <  currentEllipsoid.normals.length ; normalIndex++) {

                normalToAdd = currentEllipsoid.normals[normalIndex];
                normalArray.push(normalToAdd[0],normalToAdd[1],normalToAdd[2])
            }

            //   same logic as for triangle
            for (whichSetVert=0; whichSetVert < currentEllipsoid.vertices.length; whichSetVert++) {
                vtxToAdd = currentEllipsoid.vertices[whichSetVert];
                coordArray.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);

                var diffuse_color = currentEllipsoid.diffuse;
                var ambient_color = currentEllipsoid.ambient;
                var specular_color = currentEllipsoid.specular;

                colorArray_d.push(diffuse_color[0],diffuse_color[1],diffuse_color[2],1)
                colorArray_a.push(ambient_color[0],ambient_color[1],ambient_color[2],1)
                colorArray_s.push(specular_color[0],specular_color[1],specular_color[2],1)
                
            } // end for vertices in set
               
               console.log("no of triangle vertex  groups : "+coordArray.length / 3) 
               console.log("no of colors : "+colorArray_d.length / 4)
                
            // set up the triangle index array, adjusting indices across sets
            for (whichSetTri=0; whichSetTri < currentEllipsoid.triangles.length; whichSetTri++) {
                vec3.add(triToAdd,indexOffset,currentEllipsoid.triangles[whichSetTri]);
                indexArray.push(triToAdd[0],triToAdd[1],triToAdd[2]);
            } // end for triangles in set





            vtxBufferSize += currentEllipsoid.vertices.length; // total number of vertices
            triBufferSize += currentEllipsoid.triangles.length; // total number of tris
        } // end for each triangle set 


        console.log(" vertices : " + coordArray.length / 3)
        console.log(" ambient_color : "+ colorArray_a.length /4)
        console.log(" diffuse_color : "+ colorArray_d.length /4)
        console.log(" specular_color : "+ colorArray_s.length /4)


        /*******************************************************************/


        //Triangles 

        if(desc != "ellipsoids" ) 
        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {



            vec3.set(indexOffset,vtxBufferSize,vtxBufferSize,vtxBufferSize); // update vertex offset
            
            var currentTriangle = inputTriangles[whichSet];


            for (var normalIndex = 0; normalIndex <  currentTriangle.normals.length ; normalIndex++) {

                normalToAdd = currentTriangle.normals[normalIndex];
                normalArray.push(normalToAdd[0],normalToAdd[1],normalToAdd[2])
            }


            // set up the vertex coord array
            for (whichSetVert=0; whichSetVert < currentTriangle.vertices.length; whichSetVert++) {
                vtxToAdd = currentTriangle.vertices[whichSetVert];
                coordArray.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);
               

                var diffuse_color = currentTriangle.material.diffuse;
                var ambient_color = currentTriangle.material.ambient;
                var specular_color = currentTriangle.material.specular;

                colorArray_d.push(diffuse_color[0],diffuse_color[1],diffuse_color[2],1)
                colorArray_a.push(ambient_color[0],ambient_color[1],ambient_color[2],1)
                colorArray_s.push(specular_color[0],specular_color[1],specular_color[2],1)
               
            } // end for vertices in set
            
            // set up the triangle index array, adjusting indices across sets
            for (whichSetTri=0; whichSetTri < currentTriangle.triangles.length; whichSetTri++) {
                vec3.add(triToAdd,indexOffset,currentTriangle.triangles[whichSetTri]);
                indexArray.push(triToAdd[0],triToAdd[1],triToAdd[2]);
            } // end for triangles in set

            // console.log(indexArray);

            vtxBufferSize += currentTriangle.vertices.length; // total number of vertices
            triBufferSize += currentTriangle.triangles.length; // total number of tris
        } // end for each triangle set 

        /*******************************************************************/


        triBufferSize *= 3; // now total number of indices
        // send the vertex coords to webGL
    

        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer
        
       
        //setting the color of the shapes
        colorBuffer_a = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer_a); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colorArray_a),gl.STATIC_DRAW); // coords to that buffer
        // colorBuffer_a.itemSize = 4;
        // colorBuffer_a.numSize = colorArray_a.length / colorBuffer_a.itemSize ;

        //setting the color of the shapes
        colorBuffer_d = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer_d); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colorArray_d),gl.STATIC_DRAW); // coords to that buffer
        // colorBuffer_d.itemSize = 4;
        // colorBuffer_d.numSize = colorArray_d.length / colorBuffer_d.itemSize ;

        // //setting the color of the shapes
        colorBuffer_s = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer_s); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colorArray_s),gl.STATIC_DRAW); // coords to that buffer
        // colorBuffer_s.itemSize = 4;
        // colorBuffer_s.numSize = colorArray_s.length / colorBuffer_s.itemSize ;


        normalBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normalArray),gl.STATIC_DRAW); // coords to that buffer
        

      
        // send the triangle indices to webGL
        triangleBuffer = gl.createBuffer(); // init empty triangle index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexArray),gl.STATIC_DRAW); // indices to that buffer



      }

}



// setup the webGL shaders
function setupShaders() {
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision highp float;
       
        varying vec4 vColor ;

        void main(void) {
            gl_FragColor = vColor; // all fragments are white
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 vertexPosition;
        attribute vec3 normalfPosition;
        attribute vec4 aVertexColor_diffuse;
        attribute vec4 aVertexColor_ambient;
        attribute vec4 aVertexColor_specular;


         vec3 lightPos = vec3(-1.0,3.0,-0.5);
         vec4 ambientColor = vec4(1.0, 1.0, 1.0, 1.0);
         vec4 diffuseColor = vec4(1.0, 1.0, 1.0,1.0);
         vec4 specColor = vec4(1.0, 1.0, 1.0,1.0);
        
         vec3 eye = vec3(0.5,0.5,-0.5);

         vec4 tempColor;


        varying vec4 vColor;
        float specular = 0.0;

 

        void main(void) {
            gl_Position = vec4(vertexPosition.xyz,1.0) ; // use the untransformed position

            // code for bling phong model
            vec3 lightDir = normalize(lightPos - vertexPosition);
            vec3 viewDir = normalize(eye - vertexPosition);
            vec3 halfDir = normalize(lightDir + viewDir);

            float lambertian = max(dot(lightDir,normalfPosition), 0.0); // LdoN
            float specAngle = max(dot(halfDir, normalfPosition), 0.0); // HdotN

            specular = pow(specAngle, 16.0);

            



            tempColor = (ambientColor * aVertexColor_ambient )+ (diffuseColor * aVertexColor_diffuse * lambertian )+ (specColor *aVertexColor_specular * specAngle) ;
            if (tempColor.x > 1.0)
            {
                tempColor.x = 1.0;
            }
            if (tempColor.y > 1.0)
            {
                tempColor.y = 1.0;
            }
            if (tempColor.z > 1.0)
            {
                tempColor.z = 1.0;
            }
            if (tempColor.w > 1.0)
            {
                tempColor.w = 1.0;
            }

            vColor = tempColor;
                    }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
           console.log("no compile errors")
          
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context
            

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
               
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
               
                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition"); // get pointer to vertex shader input
                gl.enableVertexAttribArray(vertexPositionAttrib); 


                // colors
                vertexColorAttrib_a = gl.getAttribLocation(shaderProgram, "aVertexColor_ambient"); // get pointer to vertex color input
                gl.enableVertexAttribArray(vertexColorAttrib_a); 

                vertexColorAttrib_d = gl.getAttribLocation(shaderProgram, "aVertexColor_diffuse"); // get pointer to vertex color input
                gl.enableVertexAttribArray(vertexColorAttrib_d); 

                vertexColorAttrib_s = gl.getAttribLocation(shaderProgram, "aVertexColor_specular"); // get pointer to vertex color input
                gl.enableVertexAttribArray(vertexColorAttrib_s); 

                //normal


                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, "normalfPosition"); // get pointer to vertex color input
                gl.enableVertexAttribArray(vertexNormalAttrib); 


                // input to shader from array
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log("in here");
        console.log(e);
    } // end catch
} // end setup shaders



// render the loaded model
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

    //vertex color buffer : activate and feed into color shader
    gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer_a); // activate
    gl.vertexAttribPointer(vertexColorAttrib_a,4,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer_d); // activate
    gl.vertexAttribPointer(vertexColorAttrib_d,4,gl.FLOAT,false,0,0); 

    gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer_s); // activate
    gl.vertexAttribPointer(vertexColorAttrib_s,4,gl.FLOAT,false,0,0); 

    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer); // activate
    gl.vertexAttribPointer(vertexNormalAttrib,3,gl.FLOAT,false,0,0); // feed


    // triangle buffer: activate and render
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate


    gl.drawElements(gl.TRIANGLES,triBufferSize,gl.UNSIGNED_SHORT,0); // render
} // end render triangles




/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
 // loadTriangles(); // load in the triangles from tri file
  loadShapes("");
  setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL
  
} // end main
