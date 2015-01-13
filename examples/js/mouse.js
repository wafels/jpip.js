var mouseDown = false;
var lastMouse = null;
var lastPhi = 0.;
var lastTheta = 0.;
var activeIndex = 0;
getCanvasCoordinates = function(event) {
    var coordinates = {};
    var rect = core.canvas.getBoundingClientRect();
    coordinates.x = event.clientX - rect.left;
    coordinates.y = event.clientY - rect.top;
    return coordinates;
}
function handleMouseDown(event) {
    mouseDown = true;
    var canvasCoordinates = getCanvasCoordinates(event);

    var vpm = core.projectionMatrix[0].inverse();
    // var vm = core.viewProjectionMatrix[0].inverse();

    var solarCoordinates = vpm.multiply($V([ 2. * (canvasCoordinates.x / core.viewport.totalWidth - 0.5), 2. * (canvasCoordinates.y / core.viewport.totalWidth - 0.5), 0., 0. ]));
    var solarCoordinates3Dz = Math.sqrt(1 - solarCoordinates.dot(solarCoordinates));
    var solarCoordinates3D = solarCoordinates.dup();
    solarCoordinates3D.elements[2] = solarCoordinates3Dz;
    // var solarCoordinates3D = vm.multiply($V([ 2. * (canvasCoordinates.x /
    // core.viewport.totalWidth - 0.5), 2. * (canvasCoordinates.y /
    // core.viewport.totalWidth - 0.5), 0., 0. ]));
    // solarCoordinates3D = $V([ solarCoordinates3D.elements[0],
    // solarCoordinates3D.elements[1], solarCoordinates3D.elements[2] ]);
    document.getElementById("canvasCoordinates").innerHTML = "" + canvasCoordinates.x + " " + canvasCoordinates.x;
    document.getElementById("solarCoordinates").innerHTML = "" + solarCoordinates.elements[0] + " " + solarCoordinates.elements[1] + " " + solarCoordinates.elements[2] + " " + solarCoordinates.elements[3];
    document.getElementById("solarCoordinates3D").innerHTML = "" + solarCoordinates3D.elements[0] + " " + solarCoordinates3D.elements[1] + " " + solarCoordinates3D.elements[2];
    varsign = 1.;

    lastPhi = Math.atan(solarCoordinates3D.elements[0] / solarCoordinates3D.elements[2]);
    lastTheta = Math.acos(solarCoordinates3D.elements[1]) - Math.PI / 2.;
    document.getElementById("thetaPhi").innerHTML = "phi:" + lastPhi * 180. / Math.PI + " theta:" + lastTheta * 180. / Math.PI;

    lastMouse = solarCoordinates;

    var vcl = core.viewport.totalWidth / core.viewport.columns;
    var vrl = core.viewport.totalHeight / core.viewport.rows;
    var quit = false;

    for (var ll = 0; !quit && ll < core.viewport.columns; ll++) {
        for (var rr = 0; !quit && rr < core.viewport.rows; rr++) {
            if (canvasCoordinates.x >= ll * vcl && canvasCoordinates.x <= ll * vcl + vcl && canvasCoordinates.y >= rr * vrl && canvasCoordinates.y <= rr * vrl + vrl) {
                quit = true;
                activeIndex = core.viewport.columns * (core.viewport.rows - 1 - rr) + ll;
            }
        }
    }
}

function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    var canvasCoordinates = getCanvasCoordinates(event);
    var vpm = core.projectionMatrix[0].inverse();

    var solarCoordinates = vpm.multiply($V([ 2. * (canvasCoordinates.x / core.viewport.totalWidth - 0.5), 2. * (canvasCoordinates.y / core.viewport.totalWidth - 0.5), 0., 0. ]));
    var solarCoordinates3Dz = Math.sqrt(1 - solarCoordinates.dot(solarCoordinates));

    var solarCoordinates3D = solarCoordinates.dup();
    solarCoordinates3D.elements[2] = solarCoordinates3Dz;

    var deltaX = solarCoordinates.elements[0] - lastMouse.elements[0];
    var deltaY = -(solarCoordinates.elements[1] - lastMouse.elements[1]);
    phi = Math.atan(solarCoordinates3D.elements[0] / solarCoordinates3D.elements[2]);
    theta = Math.acos(solarCoordinates3D.elements[1]) - Math.PI / 2.;
    M1 = Matrix.Rotation((lastTheta - theta), $V([ 1, 0, 0 ]));
    M2 = Matrix.Rotation(-(lastPhi - phi), $V([ 0, 1, 0 ]));
    M = M2.x(M1);
    if (!(isNaN(phi) || isNaN(lastPhi) || isNaN(theta) || isNaN(lastTheta))) {
        core.theta += (lastTheta - theta);
        core.phi += (lastPhi - phi);

        // core.mouseMatrix[activeIndex] =
        // core.mouseMatrix[activeIndex].multiply(M.ensure4x4());
    }
    // core.mouseMatrix[activeIndex].multiply(Matrix.Translation($V([ deltaX,
    // deltaY, 0 ])).ensure4x4());

    lastPhi = phi;
    lastTheta = theta;
}

handleMouseWheel = function(event) {

    var target = event.target || event.srcElement;
    var rect = target.getBoundingClientRect();
    var offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    var newX = offsetX;
    var newY = core.viewport.totalHeight - offsetY;

    var vcl = core.viewport.totalWidth / core.viewport.columns;
    var vrl = core.viewport.totalHeight / core.viewport.rows;
    var index;
    var quit = false;

    for (var ll = 0; !quit && ll < core.viewport.columns; ll++) {
        for (var rr = 0; !quit && rr < core.viewport.rows; rr++) {
            if (newX >= ll * vcl && newX <= ll * vcl + vcl && newY >= rr * vrl && newY <= rr * vrl + vrl) {
                quit = true;
                index = core.viewport.columns * (core.viewport.rows - 1 - rr) + ll;
            }
        }
    }

    var wheel = event.wheelDelta / 120;// n or -n

    var zoom = 1 + wheel / 2;
    core.zoom[index] = core.zoom[index] * zoom;
    if (core.zoom[index] < 0.1) {
        core.zoom[index] = 0.1;
    }
    if (core.zoom[index] > 1.8) {
        core.zoom[index] = 1.8;
    }
    core.computeProjectionMatrix(index);
    event.preventDefault();
}