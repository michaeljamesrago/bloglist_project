const dummy = (blogs) => {
  console.log(blogs)
  // ...
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((acc, blog) => acc + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  return blogs.reduce((top, blog) => {
    return blog.likes > top.likes ? blog : top
  }, {likes: -1});
}


module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}
