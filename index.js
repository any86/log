import { exec, execSync } from 'child_process'
import fs from 'fs';
const keys = ['refactor', 'fix', 'perf', 'feat']
const TITLE_MAP = {
    refactor:'🚀Refactors',
    feat:'⭐Features',
    fix: '📐Bug Fixes',
    perf: '🎉Performance Improvements'
}

function getLog() {
    const END_TAG = '--END--'
    const SEPARATOR_TAG = '--SEPARATOR--'
    const cmd = `git log --after="2022-1-3"  --no-merges --date=format:"%Y-%m-%d %H:%M:%S"  --pretty=format:"%B${SEPARATOR_TAG}%cd${SEPARATOR_TAG}%h${SEPARATOR_TAG}%H${END_TAG}"`
    const logString = execSync(cmd).toString().trim();
    const log = logString.split(END_TAG);
    // 删除最后一行空数据
    log.pop();
    const list = [];
    for (const row of log) {
        const oneLogArray = row.split(SEPARATOR_TAG);

        // 删除描述中开头结尾的\n
        oneLogArray[0] = oneLogArray[0].replace(/^\n/, '').replace(/\s*$/, '');
        const [message, time, shortHash, hash] = oneLogArray;
        const date = time.replace(/\s\d{2}:\d{2}:\d{2}/, '')
        const oneLog = { message, date, time, shortHash, hash };

        for (const key of keys) {
            if (message.includes(key)) {
                // 标记类型(fix/feat...)
                oneLog.type = key;
                const rule = new RegExp(`${key}\\s*:\\s*`)
                oneLog.message = oneLog.message.replace(rule, '')
            }
        }
        list.push(oneLog);
    }
    return list
}

function _groupLogByDate(log) {
    const dateSet = new Set();
    // 分组
    const group = {};

    // 遍历数据到组
    for (const row of log) {
        const { date, message, type } = row;
        dateSet.add(date);
        if (void 0 === group[date]) {
            group[date] = {};
        }

        // 填充数据
        for (const key of keys) {
            if (type === key) {
                group[date][key] = group[date][key] || [];
                group[date][key].push(row);
                break;
            }
        }
    }
    return [group, dateSet];
}

function genMD(group, dateSet, title = '更新日志') {
    const mdArray = [`# ${title}`];
    for (const date of dateSet) {
        if(0 === Object.keys(group[date]).length) continue;
        // 日期
        mdArray.push(`## ${date}\n`);

        for (const key of keys) {
            if (void 0 === group[date][key]) continue;
            // 类型
            mdArray.push(`### ${TITLE_MAP[key]}\n`);
            
            // 内容
            for (const commit of group[date][key]) {
                mdArray.push(`${commit.message}\n`);
            }

        }
    }
    fs.writeFileSync('CHANGELOG.md', mdArray.join('\n'))
}


const g = getLog()
const [group, dateSet] = _groupLogByDate(g);
genMD(group, dateSet)




