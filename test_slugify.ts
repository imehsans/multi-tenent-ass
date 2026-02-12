
import slugify from 'slugify';
console.log('Type of slugify:', typeof slugify);
console.log('Is slugify a function?', typeof slugify === 'function');
try {
  console.log('Test slug:', slugify('Test String', { lower: true }));
} catch (e) {
  console.error('Error calling slugify:', e);
}
