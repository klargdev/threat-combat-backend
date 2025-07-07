# 🏗️ Threat Combat Role Hierarchy Guide

## 📋 **Overview**

Threat Combat has a clear hierarchical role system with three main entry points and role-based permissions for managing the platform.

## 🚪 **Entry Points (3 Types)**

### **1. Student/Regular User**
- **Registration Endpoint**: `POST /api/auth/register`
- **Default Role**: `member`
- **Scope**: Chapter-based activities
- **Chapter Assignment**: Automatic based on university
- **Can Be Promoted To**: `executive` → `chapter_admin`

### **2. Industry Partner/Professional**
- **Registration Endpoint**: `POST /api/auth/register/industry`
- **Default Role**: `industry_partner`
- **Scope**: Global access, no chapter assignment
- **Chapter Assignment**: None (global role)
- **Can Be Promoted To**: `super_admin` (by Threat Combat HQ only)

### **3. Super Admin (Threat Combat HQ)**
- **Registration**: Manual creation only (no public endpoint)
- **Default Role**: `super_admin`
- **Scope**: Complete platform control
- **Chapter Assignment**: None (global role)
- **Can Assign**: Any role to anyone

## 🏛️ **Role Hierarchy**

```
Threat Combat HQ (Super Admin)
├── Can assign Chapter Admin to any user
├── Can assign Super Admin to industry partners only
├── Can assign Executive roles
└── Complete platform control

Chapter Admin (University Level)
├── Can assign Executive roles within their chapter
├── Cannot assign Chapter Admin roles
├── Cannot assign Super Admin roles
└── Manages their own chapter

Executive (Chapter Level)
├── Can manage chapter activities
├── Cannot assign any roles
├── Reports to Chapter Admin
└── Chapter-based permissions

Member (Student)
├── Basic chapter access
├── Cannot assign roles
├── Reports to Chapter Admin/Executive
└── Chapter-based activities

Industry Partner
├── Global platform access
├── Cannot assign roles
├── Can be promoted to Super Admin
└── No chapter assignment
```

## 🔐 **Role Assignment Permissions**

### **Super Admin Can Assign:**
- ✅ `chapter_admin` - To any user in any chapter
- ✅ `super_admin` - To industry partners only
- ✅ `executive` - To any user in any chapter

### **Chapter Admin Can Assign:**
- ✅ `executive` - To users within their own chapter only
- ❌ `chapter_admin` - Cannot assign (reserved for Super Admin)
- ❌ `super_admin` - Cannot assign (reserved for Super Admin)

### **Executive Can Assign:**
- ❌ No role assignment permissions
- ✅ Can manage chapter activities and content

### **Member Can Assign:**
- ❌ No role assignment permissions
- ✅ Can participate in chapter activities

### **Industry Partner Can Assign:**
- ❌ No role assignment permissions
- ✅ Can access global platform features

## 📧 **Registration Requirements**

### **Student Registration:**
```json
{
  "name": "John Doe",
  "email": "john.doe@atu.edu.gh",
  "password": "password123",
  "university": "Accra Technical University",
  "department": "Computer Science",
  "level": "undergraduate",
  "gpa": 3.2,
  "dfirStatement": "200-word statement about DFIR interest...",
  "phone": "+233 24 826 3695",
  "location": "Accra, Ghana"
}
```

### **Industry Partner Registration:**
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@company.com",
  "password": "password123",
  "professionalInfo": {
    "company": "CyberSec Solutions Ltd",
    "position": "Senior Security Analyst",
    "industry": "Cybersecurity",
    "experience": 5,
    "expertise": ["DFIR", "Malware Analysis", "Incident Response"]
  },
  "contactInfo": {
    "phone": "+233 24 826 3695",
    "location": "Accra, Ghana"
  }
}
```

## 🔄 **Role Assignment Endpoints**

### **1. Assign Admin Role** - `POST /api/auth/assign-admin`
```json
{
  "email": "john.doe@atu.edu.gh",
  "newRole": "executive",
  "chapterId": "atu-chapter-id" // Only required for chapter_admin role
}
```
- **Super Admin**: Can assign any role
- **Chapter Admin**: Can only assign executive roles within their chapter

### **2. Assign Executive Role** - `POST /api/auth/assign-executive`
```json
{
  "email": "jane.doe@atu.edu.gh"
}
```
- **Chapter Admin Only**: Simplified endpoint for executive assignments
- **Same Chapter Only**: Can only assign to users in their chapter

## 🛡️ **Security Features**

### **Role Assignment Restrictions:**
- ✅ **Chapter Boundary Enforcement** - Admins can only manage their own chapter
- ✅ **Role Validation** - Prevents unauthorized role assignments
- ✅ **Self-Promotion Prevention** - Users cannot promote themselves
- ✅ **Industry Partner Restriction** - Only industry partners can become super admin
- ✅ **Audit Logging** - All role assignments are logged
- ✅ **Email Notifications** - Users receive role assignment notifications

### **Registration Security:**
- ✅ **Email Verification** - Required for all users
- ✅ **GPA/CWA Validation** - Minimum 2.5 GPA for students
- ✅ **DFIR Statement Validation** - 200-word limit
- ✅ **Company Validation** - Required for industry partners
- ✅ **Rate Limiting** - Prevents spam registrations
- ✅ **Input Sanitization** - Protects against injection attacks

## 📊 **User Lifecycle**

### **Student Lifecycle:**
1. **Registration** → Member role (pending approval)
2. **Email Verification** → Required for activation
3. **Executive Team Approval** → Chapter admin approval
4. **Role Promotion** → Can be promoted to executive → chapter admin

### **Industry Partner Lifecycle:**
1. **Registration** → Industry partner role (pending approval)
2. **Email Verification** → Required for activation
3. **Threat Combat HQ Approval** → Super admin approval
4. **Role Promotion** → Can be promoted to super admin

### **Super Admin Lifecycle:**
1. **Manual Creation** → Created by existing super admin
2. **Immediate Activation** → No approval required
3. **Full Access** → Complete platform control

## 🔍 **Audit & Monitoring**

### **Logged Actions:**
- ✅ User registrations
- ✅ Role assignments
- ✅ Login attempts
- ✅ Security events
- ✅ Chapter management
- ✅ User profile changes

### **Security Monitoring:**
- ✅ Failed login attempts
- ✅ Suspicious activity
- ✅ Role assignment patterns
- ✅ Chapter access violations
- ✅ Account lockouts

## 📞 **Support & Contact**

For questions about role assignments or permissions:
- **Email**: info@threatcombatgh.com
- **Website**: threatcombatgh.com
- **Phone**: +233 24 826 3695

---

**Note**: This role hierarchy is designed to support the Threat Combat cybersecurity education platform and ensure proper access control while maintaining flexibility for chapter management. 