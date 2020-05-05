"use strict";
var Physics = /** @class */ (function () {
    function Physics() {
        this.radius = 0.15;
        this.x = 0;
        this.y = 0;
        this.xV = 0;
        this.yV = 0;
        this.maxAngle = 0.79;
        this.length = 3;
        this.gravity = 9.8;
        this.height = 3;
        this.freefall = false;
        this.width = 0;
        this.slowMotion = false;
    }
    Physics.prototype.recalculate = function () {
        if (this.freefall) {
            var deltaTime = 60;
            if (this.slowMotion) {
                deltaTime *= 3;
            }
            this.yV -= this.gravity / deltaTime;
            this.x += this.xV / deltaTime;
            this.y += this.yV / 60;
            if (this.y - this.radius < 0) {
                this.y = this.radius;
                this.yV = Math.abs(this.yV) * 0.8;
                this.xV *= 0.99;
            }
            if (this.x + this.radius > this.width / 2) {
                this.x = this.width / 2 - this.radius;
                this.xV *= -0.95;
            }
            if (this.x - this.radius < -this.width / 2) {
                this.x = -this.width / 2 + this.radius;
                this.xV *= -0.95;
            }
        }
        else {
            var time = performance.now();
            if (this.slowMotion) {
                time = time / 3;
            }
            var angle = this.getAngle(time);
            this.x = Math.sin(angle) * this.length;
            this.y = (this.height + this.length) - Math.cos(angle) * this.length;
            this.updateVelocity();
        }
    };
    Physics.prototype.drop = function () {
        this.freefall = true;
    };
    Physics.prototype.getAngle = function (milliseconds) {
        return this.maxAngle * Math.cos(Math.sqrt(this.gravity / this.length) * milliseconds / 1000);
    };
    Physics.prototype.reset = function () {
        this.freefall = false;
        this.xV = 0;
        this.yV = 0;
    };
    Physics.prototype.updateVelocity = function () {
        var time = performance.now();
        if (this.slowMotion) {
            time = time / 3;
        }
        var angle1 = this.getAngle(time);
        var angle2 = this.getAngle(time + 0.001);
        var velocity1 = (angle2 - angle1) * 1000000 * this.length;
        //let velocity2 = -this.maxAngle * Math.sin(Math.sqrt(this.gravity / this.length) * time / 1000) * Math.sqrt(this.gravity / this.length) * this.length;
        //console.log(velocity1, velocity2);
        this.xV = Math.cos(angle1) * velocity1;
        this.yV = Math.sin(angle1) * velocity1;
    };
    return Physics;
}());
var View = /** @class */ (function () {
    function View() {
        var _this = this;
        this.drawVector = false;
        this.drawVectorComponents = false;
        this.drawPath = false;
        this.physics = new Physics();
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.pathCanvas = document.getElementById("pathCanvas");
        this.pathCtx = this.pathCanvas.getContext("2d");
        this.img = new Image();
        this.img.src = "../images/SteelBall.png";
        var resetButton = document.getElementById("reset");
        this.canvas.addEventListener("click", function () {
            if (!_this.physics.freefall) {
                _this.physics.drop();
                resetButton.disabled = false;
            }
        });
        this.updateBodyRadius();
        document.getElementById("length").addEventListener("change", function () {
            _this.physics.length = parseFloat(document.getElementById("length").value);
            _this.updateBodyRadius();
        });
        document.getElementById("height").addEventListener("change", function () {
            _this.physics.height = parseFloat(document.getElementById("height").value);
            _this.updateBodyRadius();
        });
        document.getElementById("gravity").addEventListener("change", function () {
            _this.physics.gravity = parseFloat(document.getElementById("gravity").value);
        });
        document.getElementById("angle").addEventListener("change", function () {
            _this.physics.maxAngle = (parseFloat(document.getElementById("angle").value)) * Math.PI / 180;
        });
        document.getElementById("reset").addEventListener("click", function () {
            _this.physics.reset();
            _this.pathCtx.clearRect(0, 0, _this.pathCanvas.width, _this.pathCanvas.height);
            resetButton.disabled = true;
        });
        document.getElementById("vector").addEventListener("change", function () {
            _this.drawVector = !_this.drawVector;
        });
        document.getElementById("vectorComponents").addEventListener("change", function () {
            _this.drawVectorComponents = !_this.drawVectorComponents;
        });
        document.getElementById("slowMotion").addEventListener("change", function () {
            _this.physics.slowMotion = !_this.physics.slowMotion;
        });
        document.getElementById("path").addEventListener("change", function () {
            _this.drawPath = !_this.drawPath;
        });
        this.resizeCanvases();
        window.addEventListener("resize", function () {
            _this.resizeCanvases();
        });
    }
    View.prototype.updateBodyRadius = function () {
        this.physics.radius = (this.physics.length + this.physics.height) / 50;
    };
    View.prototype.resizeCanvases = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.pathCanvas.width = window.innerWidth;
        this.pathCanvas.height = window.innerHeight;
    };
    View.prototype.draw = function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        {
            var pixelsPerMeter = this.canvas.height / (this.physics.height + this.physics.length);
            var pixelRadius = this.physics.radius * pixelsPerMeter;
            var x = this.physics.x * pixelsPerMeter;
            var y = this.physics.y * pixelsPerMeter;
            this.ctx.scale(1, -1);
            this.ctx.translate(this.canvas.width / 2, -this.canvas.height);
            this.physics.width = this.canvas.width / pixelsPerMeter;
            this.ctx.drawImage(this.img, x - pixelRadius, y - pixelRadius, 2 * pixelRadius, 2 * pixelRadius);
            //this.ctx.fillRect(-this.canvas.width / 2, 0, this.canvas.width, 10);
            this.ctx.beginPath();
            this.ctx.arc(0, this.canvas.height, 10, 0, Math.PI * 2);
            this.ctx.fill();
            if (!this.physics.freefall) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, this.canvas.height);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
            var vectorScale = 1 / 5;
            if (this.drawVector) {
                this.ctx.beginPath();
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = "red";
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + this.physics.xV * pixelsPerMeter * vectorScale, y + this.physics.yV * pixelsPerMeter * vectorScale);
                this.ctx.stroke();
            }
            if (this.drawVectorComponents) {
                this.ctx.beginPath();
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = "blue";
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + this.physics.xV * pixelsPerMeter * vectorScale, y);
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x, y + this.physics.yV * pixelsPerMeter * vectorScale);
                this.ctx.stroke();
            }
        }
        this.ctx.restore();
    };
    View.prototype.pathDraw = function () {
        this.pathCtx.save();
        {
            this.pathCtx.scale(1, -1);
            this.pathCtx.translate(this.pathCanvas.width / 2, -this.pathCanvas.height);
            var pixelsPerMeter = this.pathCanvas.height / (this.physics.height + this.physics.length);
            var pixelRadius = this.physics.radius * pixelsPerMeter;
            var x = this.physics.x * pixelsPerMeter;
            var y = this.physics.y * pixelsPerMeter;
            if (this.drawPath) {
                this.pathCtx.fillRect(x, y, 3, 3);
            }
        }
        this.pathCtx.restore();
    };
    return View;
}());
document.addEventListener("DOMContentLoaded", function () {
    var view = new View();
    function mainDraw() {
        view.physics.recalculate();
        view.draw();
        view.pathDraw();
        requestAnimationFrame(mainDraw);
    }
    mainDraw();
});
