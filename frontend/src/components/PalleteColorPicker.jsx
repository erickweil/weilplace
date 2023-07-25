import styles from '@/styles/Pixels.module.css'
import { useEffect, useState } from 'react';

const PalleteColor = (props) => {
	const {color, colorIndex, selected, onColorSelected, ...rest} = props;
	
	let className = `${styles.colorbutton}`
	if(props.selected) className += ` ${styles.pressed}`

	const onClick = (e) => {
		onColorSelected(colorIndex);
	};

	return <th 
		className={className} 
		style={{backgroundColor:`#${color}`}}
		onClick={onClick}
	>&nbsp;</th>;
}

const PalleteColorPicker = (props) => {
	const { pallete, coordinates, timeToPlaceAgain, onPlacePixel, colorIndex, setColorIndex, ...rest } = props

	//const [colorIndex, setColorIndex] = useState(0);	
	const [isPalleteOpen, setPalleteOpen] = useState(false);
	const [strDelay, setStrDelay] = useState(false);

	const placePixel = (e) => {
		onPlacePixel()
	};

	const updateStrDelay = () => {
		let timeWaitSecs = Math.ceil((timeToPlaceAgain - Date.now())/1000);
		let timeWaitMins = 0;
		let timeWaittxt = "";
		if(timeWaitSecs >= 60)
		{
			timeWaitMins = Math.floor(timeWaitSecs/60);
			timeWaitSecs = timeWaitSecs % 60;
			
			timeWaittxt = timeWaitMins+":"+timeWaitSecs+"";
		}
		else
		{
			timeWaittxt = timeWaitSecs+"s";
		}

		if(timeWaittxt != strDelay)
		{
			setStrDelay(timeWaittxt);
		}
	}

	useEffect(() => {
		if(timeToPlaceAgain < Date.now()) return;

		const timer = setInterval(() => {
			updateStrDelay();
			if(timeToPlaceAgain < Date.now()) {
				clearInterval(timer);
				setStrDelay(false);
			}
		}, 1000); // checagem a cada segundo

		updateStrDelay();

		return () => {
			clearInterval(timer);
		};
	}, [timeToPlaceAgain]);

	if(strDelay)
	{
		return (<>
			<div className={`${styles.divPlacenow}`} >
			<p >Insira um pixel novamente em <span className={`${styles.coordinates2}`}>{strDelay}</span> </p>
			</div>
		</>)
	}
	else if(!isPalleteOpen)
	return (<>
		<div className={`${styles.divPlacenow}`} onClick={(e) => setPalleteOpen(true)}>
		<p >Insira um Pixel <span className={`${styles.coordinates2}`}>[{coordinates.x},{coordinates.y}]</span></p>
		</div>
	</>)
	else
	return (
	<>
		<div className={`${styles.colorPicker}`}>
		<div className={`${styles.colorPickerTxt}`}>
		<p className={`${styles.coordinates}`}>[{coordinates.x},{coordinates.y}]</p>
		</div>
		<div className={`${styles.colorPickerTableDiv}`}>
		<table className={`${styles.colorPickerTable}`}>
		<tbody>
		<tr>
		{
			//getData("pallete",[]).map(color => {
			pallete.map((pallete_color,index) => {
			return <PalleteColor key={index} color={pallete_color} colorIndex={index} selected={index === colorIndex} onColorSelected={setColorIndex} />
			})
		}
		</tr>
		</tbody>
		</table>
		</div>
		<div className={`${styles.colorPickerButtonDiv}`}>
		<button 
		className={`${styles.button}`}
		onClick={(e) => setPalleteOpen(false)}
		>✕</button>
		<button 
		className={`${styles.button}`}
		onClick={placePixel}
		>✓</button>
		</div>
		</div>
	</>
	)
};

export default PalleteColorPicker;
