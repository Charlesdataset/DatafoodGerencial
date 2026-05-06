import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

function dayjsUtc(
  date?: dayjs.ConfigType,
  format?: dayjs.OptionType,
  strict?: boolean,
): Dayjs {
  return dayjs.utc(date as any, format as any, strict);
}
dayjsUtc.isDayjs = dayjs.isDayjs;
dayjsUtc.extend = dayjs.extend;
dayjsUtc.unix = dayjs.unix;
dayjsUtc.locale = dayjs.locale;
dayjsUtc.duration = (dayjs as any).duration;
dayjsUtc.isDuration = (dayjs as any).isDuration;

export default dayjsUtc;
