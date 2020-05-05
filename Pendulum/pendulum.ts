class Physics{
    public radius: number = 0.15;
    public x: number = 0;
    public y: number = 0;
    public xV: number = 0;
    public yV: number = 0;
    public maxAngle: number = 0.79;
    public length: number = 3;
    public gravity: number = 9.8;
    public height: number = 3;
    public freefall: boolean = false;
    public width: number = 0;
    public slowMotion: boolean = false;

    constructor(){

    }

    public recalculate(): void{
        if(this.freefall){
            let deltaTime = 60;
            if(this.slowMotion){
                deltaTime *= 3;
            }

            this.yV -= this.gravity / deltaTime;

            this.x += this.xV / deltaTime;
            this.y += this.yV / 60;

            if(this.y - this.radius < 0){
                this.y = this.radius;
                this.yV = Math.abs(this.yV) * 0.8;
                this.xV *= 0.99;
            }
            
            if(this.x + this.radius > this.width / 2){
                this.x = this.width / 2 - this.radius;
                this.xV *= -0.95;
            }

            if(this.x - this.radius < -this.width / 2){
                this.x = -this.width / 2 + this.radius;
                this.xV *= -0.95;
            }
        }
        else{
            let time = performance.now();

            if(this.slowMotion){
                time = time / 3;
            }

            let angle = this.getAngle(time);
    
            this.x = Math.sin(angle) * this.length;
            this.y = (this.height + this.length) - Math.cos(angle) * this.length;

            this.updateVelocity();
        }
    }

    public drop(): void{
        this.freefall = true;
    }

    private getAngle(milliseconds: number): number{
        return this.maxAngle * Math.cos(Math.sqrt(this.gravity / this.length) * milliseconds / 1000);
    }

    public reset(): void{
        this.freefall = false;
        this.xV = 0;
        this.yV = 0;
    }

    private updateVelocity(): void{
        let time = performance.now();

        if(this.slowMotion){
            time = time / 3;
        }

        let angle1 = this.getAngle(time);
        let angle2 = this.getAngle(time + 0.001);
        let velocity1 = (angle2 - angle1) * 1000000 * this.length;
        //let velocity2 = -this.maxAngle * Math.sin(Math.sqrt(this.gravity / this.length) * time / 1000) * Math.sqrt(this.gravity / this.length) * this.length;

        //console.log(velocity1, velocity2);

        this.xV = Math.cos(angle1) * velocity1;
        this.yV = Math.sin(angle1) * velocity1;
    }
}

class View{
    public physics: Physics;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private pathCanvas: HTMLCanvasElement;
    private pathCtx: CanvasRenderingContext2D;
    private img: HTMLImageElement;
    private drawVector: boolean = false;
    private drawVectorComponents: boolean = false;
    private drawPath: boolean = false;

    constructor(){
        this.physics = new Physics();
        this.canvas = <HTMLCanvasElement>document.getElementById("canvas");
        this.ctx = <CanvasRenderingContext2D>this.canvas.getContext("2d");
        this.pathCanvas = <HTMLCanvasElement>document.getElementById("pathCanvas");
        this.pathCtx = <CanvasRenderingContext2D>this.pathCanvas.getContext("2d");
        this.img = new Image();
        this.img.src = "Images/steelball.png";

        let resetButton = <HTMLInputElement>document.getElementById("reset")!;

        this.canvas.addEventListener("click", () => {
            if(!this.physics.freefall){
                this.physics.drop();
                resetButton.disabled = false;
            }
        });

        this.updateBodyRadius();

        document.getElementById("length")!.addEventListener("change", () => {
            this.physics.length = Number.parseFloat((<HTMLInputElement>document.getElementById("length")).value);
            this.updateBodyRadius();
        });

        document.getElementById("height")!.addEventListener("change", () => {
            this.physics.height = Number.parseFloat((<HTMLInputElement>document.getElementById("height")).value);
            this.updateBodyRadius();
        });

        document.getElementById("gravity")!.addEventListener("change", () => {
            this.physics.gravity = Number.parseFloat((<HTMLInputElement>document.getElementById("gravity")).value);
        });

        document.getElementById("angle")!.addEventListener("change", () => {
            this.physics.maxAngle = (Number.parseFloat((<HTMLInputElement>document.getElementById("angle")).value)) * Math.PI / 180;
        });

        document.getElementById("reset")!.addEventListener("click", () => {
            this.physics.reset();

            this.pathCtx.clearRect(0, 0, this.pathCanvas.width, this.pathCanvas.height);

            resetButton.disabled = true;
        });

        document.getElementById("vector")!.addEventListener("change", () => {
            this.drawVector = !this.drawVector;
        });

        document.getElementById("vectorComponents")!.addEventListener("change", () => {
            this.drawVectorComponents = !this.drawVectorComponents;
        });

        document.getElementById("slowMotion")!.addEventListener("change", () => {
            this.physics.slowMotion = !this.physics.slowMotion;
        });

        document.getElementById("path")!.addEventListener("change", () => {
            this.drawPath = !this.drawPath;
        });

        this.resizeCanvases();

        window.addEventListener("resize", () => {
            this.resizeCanvases();
        });
    }

    private updateBodyRadius(): void{
        this.physics.radius = (this.physics.length + this.physics.height) / 50;
    }

    private resizeCanvases(): void{
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.pathCanvas.width = window.innerWidth;
        this.pathCanvas.height = window.innerHeight;
    }

    public draw(): void{
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        {
            let pixelsPerMeter = this.canvas.height / (this.physics.height + this.physics.length);
            let pixelRadius = this.physics.radius * pixelsPerMeter;
            let x = this.physics.x * pixelsPerMeter;
            let y = this.physics.y * pixelsPerMeter;
            this.ctx.scale(1, -1);
            this.ctx.translate(this.canvas.width / 2, -this.canvas.height);

            this.physics.width = this.canvas.width / pixelsPerMeter;    

            this.ctx.drawImage(this.img, x - pixelRadius, y - pixelRadius, 2 * pixelRadius, 2 * pixelRadius);

            //this.ctx.fillRect(-this.canvas.width / 2, 0, this.canvas.width, 10);

            this.ctx.beginPath();
            this.ctx.arc(0, this.canvas.height, 10, 0, Math.PI * 2);
            this.ctx.fill();

            if(!this.physics.freefall){
                this.ctx.beginPath();
                this.ctx.moveTo(0, this.canvas.height);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }

            let vectorScale = 1 / 5;

            if(this.drawVector){
                this.ctx.beginPath();
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = "red";
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + this.physics.xV * pixelsPerMeter * vectorScale, y + this.physics.yV * pixelsPerMeter * vectorScale);
                this.ctx.stroke();
            }

            if(this.drawVectorComponents){
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
    }

    public pathDraw(): void{
        this.pathCtx.save();
        {
            this.pathCtx.scale(1, -1);
            this.pathCtx.translate(this.pathCanvas.width / 2, -this.pathCanvas.height);

            let pixelsPerMeter = this.pathCanvas.height / (this.physics.height + this.physics.length);
            let pixelRadius = this.physics.radius * pixelsPerMeter;
            let x = this.physics.x * pixelsPerMeter;
            let y = this.physics.y * pixelsPerMeter;
            if(this.drawPath){
                this.pathCtx.fillRect(x, y, 3, 3);
            }
        }
        this.pathCtx.restore();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let view = new View();

    function mainDraw(): void{
        view.physics.recalculate();
        view.draw();
        view.pathDraw();

        requestAnimationFrame(mainDraw);
    }

    mainDraw();
});