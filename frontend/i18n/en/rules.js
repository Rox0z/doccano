export default {
  colorRules: {
    colorRequired: 'Color is required'
  },
  labelNameRules: {
    labelRequired: 'Label name is required',
    labelLessThan100Chars: 'Label name must be less than 100 characters',
    duplicated: 'The label name is already used.'
  },
  keyNameRules: {
    duplicated: 'The key is already used.'
  },
  userNameRules: {
    userNameRequired: 'User name is required',
    userNameLessThan30Chars: 'User name must be less than 30 characters',
    minLength : 'User name must be at least 3 characters long',
  },
  roleRules: {
    roleRequired: 'Role is required'
  },
  projectName: {
    required: 'Project name is required',
    maxLength: 'Project name must be less than 100 characters'
  },
  description: {
    required: 'Description is required'
  },
  fileFormatRules: {
    fileFormatRequired: 'File format is required'
  },
  emailRules: {
    required: 'Email is required',
    format: 'Email must be valid'
  },
  uploadFileRules: {
    fileRequired: 'File is required',
    fileLessThan1MB: 'File size should be less than 100 MB!'
  },
  passwordRules: {
    required: 'Password is required',
    passwordLessThan30Chars: 'Password must be less than 30 characters',
    minLength: 'Password must be at least 8 characters long',
    match: 'Passwords must match'
  }
}
