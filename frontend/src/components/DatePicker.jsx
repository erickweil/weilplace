import styles from '@/styles/Pixels.module.css'
import { useEffect, useState } from 'react';

const DatePicker = (props) => {
	const { dates, dateSelected, onSelectDate, ...rest } = props

    let totalDates = dates.length;
    let indexDate = dates.indexOf(dateSelected);

    const [percent, setPercent] = useState(indexDate);

    const handlePercentChange = (e) => {
        setPercent(e.target.value);
        let index = e.target.value;
        onSelectDate(dates[Math.min(index,totalDates-1)]);
    };

    const dateTime = new Date(dateSelected.substring(0,dateSelected.lastIndexOf(".")).replaceAll("/","T").replaceAll(".",":")+"Z");

	return (
	<>
		<div className={`${styles.colorPicker}`}>
		<div className={`${styles.colorPickerTxt}`}>
		<p className={`${styles.coordinates}`}>[{
            dateTime.toLocaleString()
        }]</p>
		</div>
		<div className={`${styles.colorPickerTableDiv}`}>
        <input type="range" min="0" max={totalDates-1} value={percent} onChange={handlePercentChange}  style={{width:"100%"}}/>
		</div>
		</div>
	</>
	)
};

export default DatePicker;
