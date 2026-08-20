/******************************************************************************
 * @file        notesStore.js
 * @description 笔记数据存储模块（基于 @system.file 的本地持久化）
 *              提供笔记的增删改查能力：创建、保存、编辑、删除
 * @license     AGPL-3.0-only (存储模块沿用 ResonaUI 协议)
 ******************************************************************************/

import file from '@system.file'

const BASE_PATH = 'internal://files/notes'
const NOTES_FILE = BASE_PATH + '/notes.json'

// ==================== 初始化 ====================

/**
 * 初始化笔记存储目录
 */
export function init() {
  return new Promise((resolve) => {
    file.mkdir({
      uri: BASE_PATH,
      recursive: true,
      success: () => resolve(),
      fail: (data, code) => resolve() // 目录已存在(300)或其它情况均放行
    })
  })
}

// ==================== 内部工具 ====================

function readNotes() {
  return new Promise((resolve) => {
    file.readText({
      uri: NOTES_FILE,
      success: (data) => {
        try {
          const list = JSON.parse(data.text)
          resolve(Array.isArray(list) ? list : [])
        } catch (e) {
          resolve([])
        }
      },
      fail: () => resolve([])
    })
  })
}

function writeNotes(notes) {
  return new Promise((resolve, reject) => {
    file.writeText({
      uri: NOTES_FILE,
      text: JSON.stringify(notes),
      success: () => resolve(true),
      fail: (data, code) => reject(`写入笔记失败: ${code}`)
    })
  })
}

function genId() {
  return 'n_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
}

// 清除表情标记字符（\uE001 + code + \uE002）
function stripEmoji(text) {
  if (!text) return ''
  return text.replace(/\uE001[^\uE002]*\uE002/g, '')
}

const EMOJI_START = '\uE001'
const EMOJI_END = '\uE002'

// 将含表情标记的文本解析为段数组（供主页渲染图片+文字）
function buildSegments(text, maxLen) {
  if (!text) return []
  const segs = []
  let cur = ''
  let total = 0
  const flush = () => {
    if (cur) {
      if (total + cur.length > maxLen) {
        const remain = maxLen - total
        if (remain > 0) { segs.push({ text: cur.slice(0, remain) + '…', isEmoji: false }); cur = '' }
        return false
      }
      segs.push({ text: cur, isEmoji: false })
      total += cur.length
      cur = ''
    }
    return true
  }
  for (let i = 0; i < text.length; i++) {
    if (text[i] === EMOJI_START) {
      if (!flush()) break
      let code = ''; i++
      while (i < text.length && text[i] !== EMOJI_END) { code += text[i]; i++ }
      if (total + 1 > maxLen) break
      segs.push({ code: code, isEmoji: true })
      total += 1
    } else {
      cur += text[i]
    }
  }
  flush()
  return segs
}

/**
 * 生成笔记预览（去除换行、清除表情标记、截断）
 */
export function buildPreview(content) {
  if (!content) return ''
  const text = stripEmoji(content).replace(/\n/g, ' ').trim()
  return text.length > 40 ? text.slice(0, 40) + '…' : text
}

/**
 * 生成笔记显示标题（无标题时取正文首行）
 */
export function buildTitle(note) {
  if (note.title && note.title.trim()) {
    const raw = stripEmoji(note.title).trim()
    return raw.length > 20 ? raw.slice(0, 20) + '…' : raw
  }
  if (note.content) {
    const cleaned = stripEmoji(note.content)
    const firstLine = cleaned.split('\n').find(l => l.trim()) || ''
    const t = firstLine.trim()
    return t.length > 20 ? t.slice(0, 20) + '…' : (t || '无标题')
  }
  return '无标题'
}

/**
 * 生成笔记标题段数组（保留表情，供主页渲染图片+文字）
 */
export function buildTitleSegments(note) {
  let text = ''
  if (note.title && note.title.trim()) {
    text = note.title
  } else if (note.content) {
    const cleaned = note.content
    const firstLine = cleaned.split('\n').find(l => l.trim()) || ''
    text = firstLine.trim()
  }
  if (!text) return [{ text: '无标题', isEmoji: false }]
  return buildSegments(text, 20)
}

// ==================== 对外 API ====================

/**
 * 获取全部笔记（按更新时间倒序）
 * @return {Promise<Array>} 笔记数组
 */
export async function getAllNotes() {
  const notes = await readNotes()
  notes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  return notes
}

/**
 * 获取单条笔记
 */
export async function getNote(id) {
  const notes = await readNotes()
  return notes.find(n => n.id === id) || null
}

/**
 * 保存笔记（创建或更新）
 * @param {Object} note { id?, title, content, titleColors?, contentColors? }
 * @return {Promise<Object>} 保存后的笔记
 */
export async function saveNote(note) {
  const notes = await readNotes()
  const now = Date.now()

  if (note.id) {
    const idx = notes.findIndex(n => n.id === note.id)
    if (idx >= 0) {
      const updated = {
        ...notes[idx],
        title: note.title,
        content: note.content,
        updatedAt: now
      }
      // 颜色字段（字符级）：只有传入时才写入，避免覆盖老笔记
      if (note.titleColors) updated.titleColors = note.titleColors
      if (note.contentColors) updated.contentColors = note.contentColors
      if (note.titleBgs) updated.titleBgs = note.titleBgs
      if (note.contentBgs) updated.contentBgs = note.contentBgs
      if (note.titleWeights) updated.titleWeights = note.titleWeights
      if (note.contentWeights) updated.contentWeights = note.contentWeights
      if (typeof note.fontScale === 'number') updated.fontScale = note.fontScale
      if (note.bgColor) updated.bgColor = note.bgColor
      notes[idx] = updated
      await writeNotes(notes)
      return notes[idx]
    }
  }

  // 新建
  const newNote = {
    id: note.id || genId(),
    title: note.title || '',
    content: note.content || '',
    createdAt: now,
    updatedAt: now
  }
  if (note.titleColors) newNote.titleColors = note.titleColors
  if (note.contentColors) newNote.contentColors = note.contentColors
  if (note.titleBgs) newNote.titleBgs = note.titleBgs
  if (note.contentBgs) newNote.contentBgs = note.contentBgs
  if (typeof note.fontScale === 'number') newNote.fontScale = note.fontScale
  if (note.bgColor) newNote.bgColor = note.bgColor
  notes.push(newNote)
  await writeNotes(notes)
  return newNote
}

/**
 * 删除笔记
 * @param {string} id
 * @return {Promise<boolean>}
 */
export async function deleteNote(id) {
  const notes = await readNotes()
  const filtered = notes.filter(n => n.id !== id)
  await writeNotes(filtered)
  return true
}
