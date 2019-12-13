'use strict';

const l = document.getElementById.bind(document)

//点クラス
class PointData {
	constructor($key, $x, $y, $vx=0, $vy=0, $offsetX=0, $offsetY=0) {
		this.key = $key;
		this.x = $x;
		this.y = $y;
		this.vx = $vx;
		this.vy = $vy;
		this.age = 0;
		this.displayX = Math.round(this.x);
		this.displayY = Math.round(this.y);
		this.offsetX = $offsetX;
		this.offsetY = $offsetY;
	}
	
	update(tick){	//ms
		//位置
		this.x += this.vx*tick/1000;
		this.y += this.vy*tick/1000;
		//表示位置
		this.displayX = Math.round(this.x) - this.offsetX;
		this.displayY = Math.round(this.y) - this.offsetY;

		this.age += tick;
	}
}

//===================================================
//定数-----------------------------------------------
const EASY = 1000			//難易度増加係数
const POWER = 1			//ゲーム時間増加係数
const INI = 0				//初期ポイント

//変数-----------------------------------------------
let counter		//カウンタ
let oldCounter	//前回カウンタ値
let startTime	//開始時間
let lastTime	//前回処理時間
let point		//ゲーム継続ポイント


let clickX
let clickY
let clickTime
let clickInterval
let bestInterval = 9999
let loopId
let countKey = 0
const points = []

//DOM-----------------------------------------------
const e_display = l('smartPhone')
const e_btnCount = l('btnCount')
const e_btnText = l('btnText')
const e_levelText = l('level')
const e_restPoint = l('restPoint')
const e_bestClick = l('bestClick')

const eles = []

//===================================================
//ゲームのリセット
function resetGame(){
	endGame()

	counter = 0
	oldCounter = 0
	lastTime = 0
	point = INI

	e_btnCount.disabled = false
	e_btnText.textContent = counter
	e_levelText.textContent = 1
	e_restPoint.textContent = (point/1000).toFixed(0)

	e_btnCount.onclick = startGame.bind(e_btnCount)	//ゲーム開始ボタンのバインド
}

//ゲーム開始関数
function startGame(event){
	this.onclick = clickCounter	//onclickを変更
	startTime = Date.now()
	lastTime = startTime
	clickTime = 0
	clickCounter(event)
	loopId = requestAnimationFrame(loop)	//loop関数呼び出し
}

//ゲーム終了処理
function endGame(){
	cancelAnimationFrame(loopId);
	e_btnCount.disabled = true
	e_restPoint.textContent = 0

	points.length = 0
	while (eles.length > 0) {
		const item = eles.pop();
		e_display.removeChild(item.element);
		//console.log(item);
	}
}

//クリックイベント処理
function clickCounter(event){
	counter++
	e_btnText.textContent = counter
	clickX = event.pageX
	clickY = event.pageY
	clickInterval = Date.now() - clickTime
	clickTime += clickInterval
	if(bestInterval > clickInterval){
		bestInterval = clickInterval
		e_bestClick.textContent = bestInterval
	}
	//console.log(event)
}

//ループ処理
function loop(){
	//タイマ処理
	let tick = Date.now() - lastTime
	lastTime += tick
	let time = lastTime - startTime

	//ゲーム処理
	let invLevel = EASY/(EASY+time)
	let bounus = (counter-oldCounter)*invLevel*POWER*1000
	point = point + bounus - tick
	oldCounter = counter

	//点
	if(bounus > 0){	//生成
		let vy = -8000/(clickInterval+32) - 50;
		//console.log(vy)
		points.push(new PointData(countKey++, clickX, clickY, 0, vy, 20, 30))
	}
	points.forEach((p, index) => {
		p.update(tick);			//移動
		if (p.age > 1000) {
			points.splice(index, 1);	//削除
		}
	});

	//描画処理--------------------------------
	e_levelText.textContent = (POWER/invLevel).toFixed(0)
	e_restPoint.textContent = (point/1000).toFixed(2)

	//点群にない要素は削除する
	for (let i=0; i<eles.length; i++) {
		const ele = eles[i];
		const item = points.find(e => e.key === ele.key);
		if (!item) {
			eles.splice(i, 1);
			e_display.removeChild(ele.element);
		}
	}
	//要素の新規作成と更新
	points.forEach(p => {
		const item = eles.find(e => e.key === p.key);
		if (!item) {
			//新規作成
			const ele = document.createElement("div")
			ele.className = "selectNone"
			ele.classList.add("clickText")
			ele.style.position = "absolute"
			ele.style.left = p.displayX + "px"
			ele.style.top = p.displayY + "px"
			ele.textContent = "+" + (bounus/1000).toFixed(2) + "s"
			e_display.appendChild(ele)
			eles.push({key: p.key, element: ele})
			//console.log(ele)
		} else {
			//更新
			const ele = item.element;
			ele.style.left = p.displayX + "px"
			ele.style.top = p.displayY + "px"
		}
	});


	//継続判定
	if (point <= 0) {
		endGame()
	} else {
		loopId = requestAnimationFrame(loop)
	}
}


//ゲームリセット
resetGame()

//=============================================================
//PWA
//バナー表示をキャンセルし、代わりに表示するDOM要素を登録する
//引数１：イベントを登録するHTMLElement
function registerInstallAppEvent(elem){
	//インストールバナー表示条件満足時のイベントを乗っ取る
	window.addEventListener('beforeinstallprompt', function (event) {
		//console.log("beforeinstallprompt: ", event);
		event.preventDefault();			//バナー表示をキャンセル
		elem.promptEvent = event;		//eventを保持しておく
		elem.style.display = "inline-block";	//要素を表示する
		return false;
	});
	//インストールダイアログの表示処理
	function installApp() {
		if(elem.promptEvent){
			elem.promptEvent.prompt();		//ダイアログ表示
			elem.promptEvent.userChoice.then(function(choice){
				//console.log(choice);
				elem.style.display = "none";
				elem.promptEvent = null;  //一度しか使えないため後始末
			});//end then
		}
	}//end installApp
	//要素クリック時にダイアログ表示を行う
	elem.addEventListener("click", installApp);
}
//表示するボタンに、イベントを登録
registerInstallAppEvent(document.getElementById("installBtn"));